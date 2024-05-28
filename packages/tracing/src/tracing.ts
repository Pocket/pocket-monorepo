import process from 'process';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { CompositePropagator } from '@opentelemetry/core';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import {
  BatchSpanProcessor,
  SpanProcessor,
  Span,
  SamplingDecision,
  ReadableSpan,
  SpanExporter,
  TraceIdRatioBasedSampler,
  ParentBasedSampler,
  BufferConfig,
} from '@opentelemetry/sdk-trace-base';

import { DataloaderInstrumentation } from '@opentelemetry/instrumentation-dataloader';
import {
  Context,
  DiagConsoleLogger,
  DiagLogLevel,
  DiagLogger,
  diag,
} from '@opentelemetry/api';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex';
import { MySQL2Instrumentation } from '@opentelemetry/instrumentation-mysql2';
import { NetInstrumentation } from '@opentelemetry/instrumentation-net';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { Resource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

import { ExpressLayerType } from '@opentelemetry/instrumentation-express/build/src/enums/ExpressLayerType';
import {
  SentrySpanProcessor,
  SentryPropagator,
  SentrySampler,
  wrapContextManagerClass,
} from '@sentry/opentelemetry';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';

import * as Sentry from '@sentry/node';

// instrumentations available to be added by implementing services
export enum AdditionalInstrumentation {
  KNEX = 'KNEX',
  PRISMA = 'PRISMA',
}

// available optional instrumentations
// used to instantiate instrumentations specified in the config
const additionalInstrumentationConstructors = {
  KNEX: KnexInstrumentation,
  PRISMA: PrismaInstrumentation,
};

export type TracingConfig = {
  serviceName: string;
  release: string;
  samplingRatio?: number;
  graphQLDepth?: number;
  grpcDefaultPort?: number;
  httpDefaultPort?: number;
  host?: string;
  logger?: DiagLogger;
  addSentry?: Boolean;
  additionalInstrumentations?: AdditionalInstrumentation[];
};

const tracingDefaults: TracingConfig = {
  serviceName: 'unknown',
  release: 'unknown',
  samplingRatio: 0.2,
  graphQLDepth: 8,
  grpcDefaultPort: 4317,
  httpDefaultPort: 4318,
  host: 'otlpcollector',
  logger: new DiagConsoleLogger(),
  addSentry: false,
  additionalInstrumentations: [],
};
/**
 * Init a sentry context manager to be used for request isolation
 */
const SentryContextManager = wrapContextManagerClass(
  AsyncLocalStorageContextManager,
);

/**
 * function to setup open-telemetry tracing config
 * Note: this function has to run before initial
 * server start and import to patch all libraries
 */
export async function nodeSDKBuilder(config: TracingConfig) {
  config = { ...tracingDefaults, ...config };
  /**
   * documentation:https://aws-otel.github.io/docs/getting-started/js-sdk/trace-manual-instr#instrumenting-the-aws-sdk
   * and https://github.com/open-telemetry/opentelemetry-js
   * sample apps: https://github.com/aws-observability/aws-otel-community/blob/master/sample-apps/javascript-sample-app/nodeSDK.js
   */

  //tracing level set for open-telemetry
  diag.setLogger(config.logger, DiagLogLevel.WARN);

  const _resource = Resource.default().merge(
    new Resource({
      [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: config.release,
    }),
  );

  const _traceExporter = new OTLPTraceExporter({
    //collector url
    url: `http://${config.host}:${config.grpcDefaultPort}`,
  });
  const _spanProcessors: SpanProcessor[] = [
    new CustomAWSXraySpanProcessor(_traceExporter, config.samplingRatio, {
      // only force 100ms between 2 batch exports.
      // Default is 5000ms which is 5 seconds and causes us to lose spans
      scheduledDelayMillis: 100,
    }),
  ];
  if (config.addSentry) {
    _spanProcessors.push(new CustomSentrySpanProcessor());
  }
  const _idGenerator = new AWSXRayIdGenerator();

  // set up the default instrumentations for all implementors
  const instrumentations: any[] = [
    new AwsInstrumentation({
      suppressInternalInstrumentation: true,
    }),
    new DataloaderInstrumentation({}),
    new ExpressInstrumentation({
      ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
    }),
    new GraphQLInstrumentation({
      // optional params
      depth: config.graphQLDepth, //query depth
      allowValues: true,
    }),
    new HttpInstrumentation({
      ignoreIncomingPaths: ['/.well-known/apollo/server-health'],
    }),
    new MySQL2Instrumentation({}),
    new NetInstrumentation({}),
  ];

  // add any instrumentations specified by the implementing service
  config.additionalInstrumentations.forEach((instrumentation) => {
    instrumentations.push(
      new additionalInstrumentationConstructors[instrumentation](),
    );
  });

  const sdk = new NodeSDK({
    textMapPropagator: config.addSentry
      ? new CompositePropagator({
          propagators: [new AWSXRayPropagator(), new SentryPropagator()],
        })
      : new AWSXRayPropagator(),
    instrumentations,
    contextManager: config.addSentry ? new SentryContextManager() : undefined,
    resource: _resource,
    spanProcessors: _spanProcessors,
    traceExporter: _traceExporter,
    idGenerator: _idGenerator,
  });

  // this enables the API to record telemetry
  sdk.start();

  // gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => diag.info('Tracing and Metrics terminated'))
      .catch((error) =>
        diag.error('Error terminating tracing and metrics', error),
      )
      .finally(() => process.exit(0));
  });
  //todo: export tracer object to enable/test custom tracing
}

/******
 * Open Telemetry does not allow us to use different sampling ratios per system we export too.
 * Too counteract this, we create custom processors that call the respecitive samplers instead.
 *
 * We do this because we pay more for Sentry profiling then AWS Profiling and only want to send a limited subset of traces to sentry
 ******/

/**
 * Custom batch exporter for AWS XRay with our own sampling rules
 */
export class CustomAWSXraySpanProcessor extends BatchSpanProcessor {
  sampler: ParentBasedSampler;
  // map to hold the contexts from onStart, used in onEnd
  contextMap: Map<string, Context>;

  constructor(_exporter: SpanExporter, ratio: number, config: BufferConfig) {
    super(_exporter, config);
    this.contextMap = new Map();
    this.sampler = new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(ratio),
    });
  }
  onStart(span: Span, parentContext: Context) {
    this.contextMap.set(span.spanContext().traceId, parentContext);
    const sampleResult = this.sampler.shouldSample(
      parentContext,
      span.spanContext().traceId,
      span.name,
      span.kind,
      span.attributes,
      span.links,
    );
    if (sampleResult.decision == SamplingDecision.RECORD_AND_SAMPLED) {
      super.onStart(span, parentContext);
    }
  }

  onEnd(span: ReadableSpan) {
    const context = this.contextMap.get(span.spanContext().traceId);

    if (context) {
      const sampleResult = this.sampler.shouldSample(
        context,
        span.spanContext().traceId,
        span.name,
        span.kind,
        span.attributes,
        span.links,
      );
      // After processing, clean up the context from the map
      this.contextMap.delete(span.spanContext().traceId);
      if (sampleResult.decision == SamplingDecision.RECORD_AND_SAMPLED) {
        super.onEnd(span);
      }
    }
  }
}

/**
 * Custom Exporter for Sentry that uses the sentry client traces sample rate to export to sentry
 */
export class CustomSentrySpanProcessor extends SentrySpanProcessor {
  sampler: SentrySampler;
  // map to hold the contexts from onStart, used in onEnd
  contextMap: Map<string, Context>;

  constructor() {
    super();
    this.contextMap = new Map();
    this.sampler = new SentrySampler(Sentry.getClient());
  }
  onStart(span: Span, parentContext: Context) {
    this.contextMap.set(span.spanContext().traceId, parentContext);
    const sampleResult = this.sampler.shouldSample(
      parentContext,
      span.spanContext().traceId,
      span.name,
      span.kind,
      span.attributes,
      span.links,
    );
    if (sampleResult.decision == SamplingDecision.RECORD_AND_SAMPLED) {
      super.onStart(span, parentContext);
    }
  }

  onEnd(span: Span & ReadableSpan) {
    const context = this.contextMap.get(span.spanContext().traceId);

    if (context) {
      const sampleResult = this.sampler.shouldSample(
        context,
        span.spanContext().traceId,
        span.name,
        span.kind,
        span.attributes,
        span.links,
      );
      // After processing, clean up the context from the map
      this.contextMap.delete(span.spanContext().traceId);
      if (sampleResult.decision == SamplingDecision.RECORD_AND_SAMPLED) {
        super.onEnd(span);
      }
    }
  }
}
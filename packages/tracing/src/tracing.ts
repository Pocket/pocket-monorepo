import process from 'process';
import { NodeSDK, logs } from '@opentelemetry/sdk-node';
import {
  Context,
  DiagConsoleLogger,
  DiagLogLevel,
  Link,
  SpanAttributes,
  SpanKind,
  diag,
  isValidTraceId,
} from '@opentelemetry/api';
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex';

import { OTLPTraceExporter as HTTPOTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPTraceExporter as GRPCOTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';

import { OTLPLogExporter as HTTPOTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPLogExporter as GRPCOTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';

import { PrismaInstrumentation } from '@prisma/instrumentation';
import { Detector, Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

import { SentryPropagator, wrapSamplingDecision } from '@sentry/opentelemetry';
// import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
// import { OTLPMetricExporter as HTTPOTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
// import { OTLPMetricExporter as GRPCOTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

import {
  DetectorSync,
  IResource,
  ResourceDetectionConfig,
  envDetectorSync,
  hostDetectorSync,
  processDetectorSync,
} from '@opentelemetry/resources';
import { awsEcsDetectorSync } from '@opentelemetry/resource-detector-aws';

import * as Sentry from '@sentry/node';

import {
  BatchSpanProcessor,
  BufferConfig,
  ParentBasedSampler,
  Sampler,
  SamplingDecision,
  SamplingResult,
} from '@opentelemetry/sdk-trace-base';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { CompositePropagator } from '@opentelemetry/core';

import { type Unleash } from 'unleash-client';

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
  url?: string;
  protocol?: 'GRPC' | 'HTTP';
  unleash: Unleash;
  flagName?: string;
  additionalInstrumentations?: AdditionalInstrumentation[];
};

const tracingDefaults: TracingConfig = {
  serviceName: 'unknown',
  release: 'unknown',
  graphQLDepth: 8,
  url: 'http://localhost:4318',
  protocol: 'HTTP',
  unleash: {} as Unleash, // no-op cause its required in the config
  flagName: 'perm.backend.sentry-trace-sampler-rate',
  additionalInstrumentations: [],
};

// TODO: Remove after issue is fixed
// https://github.com/open-telemetry/opentelemetry-js/issues/4638
/**
 * A detector that returns attributes from the environment.
 */
function awaitAttributes(detector: DetectorSync): Detector {
  return {
    /**
     * A function that returns a promise that resolves with the attributes
     */
    async detect(config: ResourceDetectionConfig): Promise<IResource> {
      const resource = detector.detect(config);
      await resource.waitForAsyncAttributes?.();
      console.log('Detected resource: ', resource);
      return resource;
    },
  };
}

const batchConfig: BufferConfig = {
  maxQueueSize: 4096,
  maxExportBatchSize: 1000,
  scheduledDelayMillis: 500,
  exportTimeoutMillis: 5000,
};

/**
 * function to setup open-telemetry tracing config
 * Note: this function has to run before initial
 * server start and import to patch all libraries
 */
export async function nodeSDKBuilder(config: TracingConfig) {
  config = { ...tracingDefaults, ...config };
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

  /**
   * documentation:https://aws-otel.github.io/docs/getting-started/js-sdk/trace-manual-instr#instrumenting-the-aws-sdk
   * and https://github.com/open-telemetry/opentelemetry-js
   * sample apps: https://github.com/aws-observability/aws-otel-community/blob/master/sample-apps/javascript-sample-app/nodeSDK.js
   */

  const _resource = Resource.default().merge(
    new Resource({
      [ATTR_SERVICE_NAME]: config.serviceName,
      [ATTR_SERVICE_VERSION]: config.release,
    }),
  );

  const _traceExporter =
    config.protocol === 'HTTP'
      ? new HTTPOTLPTraceExporter({
          //collector url
          url: `${config.url}/v1/traces`,
        })
      : new GRPCOTLPTraceExporter({ url: config.url });

  // const _metricReader = new PeriodicExportingMetricReader({
  //   exporter:
  //     config.protocol === 'HTTP'
  //       ? new HTTPOTLPMetricExporter({
  //           url: `${config.url}/v1/metrics`,
  //         })
  //       : new GRPCOTLPMetricExporter({ url: config.url }),
  //   // once every 60 seconds, GCP supports 1 every 5 seconds for custom metrics https://cloud.google.com/monitoring/quotas#custom_metrics_quotas
  //   // But lets just do 60 seconds for now as we figure it out
  //   exportIntervalMillis: 60000,
  //   exportTimeoutMillis: 5000,
  // });

  const _logExporter =
    config.protocol === 'HTTP'
      ? new HTTPOTLPLogExporter({ url: `${config.url}/v1/logs` })
      : new GRPCOTLPLogExporter({ url: config.url });

  // set up the default instrumentations for all implementors
  const instrumentations: any[] = [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        // Disabling Filesystem instrumentation because it is very noisey and memory intense.
        enabled: false,
        requireParentSpan: true,
      },
      '@opentelemetry/instrumentation-undici': {
        headersToSpanAttributes: {
          // Outgoing fetch headers to capture on the span
          requestHeaders: ['sentry-trace', 'baggage', 'x-amzn-trace-id'],
        },
      },
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/.well-known/apollo/server-health'],
        headersToSpanAttributes: {
          server: {
            // Incoming request headers to be added as span attributes for debugging
            requestHeaders: [
              'encodedid',
              'applicationname',
              'apiId',
              'gatewayUserAgent',
              'premium',
              'content-type',
            ],
          },
        },
      },
      '@opentelemetry/instrumentation-graphql': {
        ignoreTrivialResolveSpans: true,
        allowValues: true,
      },
    }),
  ];

  // add any instrumentations specified by the implementing service
  (config.additionalInstrumentations ?? []).forEach((instrumentation) => {
    instrumentations.push(
      new additionalInstrumentationConstructors[instrumentation](),
    );
  });
  const sdk = new NodeSDK({
    textMapPropagator: new CompositePropagator({
      propagators: [new AWSXRayPropagator(), new SentryPropagator()],
    }),
    instrumentations,
    sampler: new SentryParentSampler({
      root: new ParentBasedSampler({
        root: new UnleashSampler({
          unleash: config.unleash,
          flagName: config.flagName as string, // will never be null cause of defaults
        }),
      }),
    }),
    contextManager: new Sentry.SentryContextManager(),
    resource: _resource,
    idGenerator: new AWSXRayIdGenerator(),
    spanProcessors: [new BatchSpanProcessor(_traceExporter, batchConfig)],
    // Disabling metrics until traces feel in the right space.
    // metricReader: _metricReader,
    logRecordProcessors: [
      new logs.BatchLogRecordProcessor(_logExporter, batchConfig),
    ],
    // TODO: Remove after issue is fixed
    // https://github.com/open-telemetry/opentelemetry-js/issues/4638
    resourceDetectors: [
      awaitAttributes(envDetectorSync),
      awaitAttributes(hostDetectorSync),
      awaitAttributes(processDetectorSync),
      awaitAttributes(awsEcsDetectorSync),
    ],
  });

  // this enables the API to record telemetry
  sdk.start();
  //tracing level set for open-telemetry
  // this has to happen after the OTEL is setup so that the ts-logger is patched
  diag.info('Tracer successfully started');

  // Validate that the setup is correct
  Sentry.validateOpenTelemetrySetup();

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

/**
 * Given an unleash flag and client will make a sampling decision based on the flag value.
 *
 * Majority copied from https://github.com/open-telemetry/opentelemetry-js/blob/main/packages/opentelemetry-sdk-trace-base/src/sampler/TraceIdRatioBasedSampler.ts
 */
class UnleashSampler implements Sampler {
  private _unleash: Unleash;
  private _flagName: string;

  private _upperBound: number;
  private _ratio: number;

  constructor(config: { unleash: Unleash; flagName: string }) {
    this._flagName = config.flagName;
    this._unleash = config.unleash;
    this.setRatio(0);
  }

  /**
   * Checks whether span needs to be created and tracked.
   *
   * @param context Parent Context which may contain a span.
   * @param traceId of the span to be created. It can be different from the
   *     traceId in the {@link SpanContext}. Typically in situations when the
   *     span to be created starts a new trace.
   * @param spanName of the span to be created.
   * @param spanKind of the span to be created.
   * @param attributes Initial set of SpanAttributes for the Span being constructed.
   * @param links Collection of links that will be associated with the Span to
   *     be created. Typically useful for batch operations.
   * @returns a {@link SamplingResult}.
   */
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: SpanAttributes,
    links: Link[],
  ): SamplingResult {
    this.updateFlagValue();
    return {
      decision:
        isValidTraceId(traceId) && this._accumulate(traceId) < this._upperBound
          ? SamplingDecision.RECORD_AND_SAMPLED
          : SamplingDecision.NOT_RECORD,
    };
  }

  updateFlagValue() {
    const variant = this._unleash.getVariant(this._flagName);
    if (variant.payload != null) {
      if (variant.payload.type === 'number') {
        this.setRatio(parseFloat(variant.payload.value));
      } else {
        this.setRatio(0);
      }
    } else {
      this.setRatio(0);
    }
  }

  setRatio(ratio: number) {
    this._ratio = this._normalize(ratio);
    this._upperBound = Math.floor(this._ratio * 0xffffffff);
  }

  toString() {
    return UnleashSampler.name;
  }

  private _normalize(ratio: number): number {
    if (typeof ratio !== 'number' || isNaN(ratio)) return 0;
    return ratio >= 1 ? 1 : ratio <= 0 ? 0 : ratio;
  }

  private _accumulate(traceId: string): number {
    let accumulation = 0;
    for (let i = 0; i < traceId.length / 8; i++) {
      const pos = i * 8;
      const part = parseInt(traceId.slice(pos, pos + 8), 16);
      accumulation = (accumulation ^ part) >>> 0;
    }
    return accumulation;
  }
}

/**
 * Class to wrap all our sampling logic because sentry wants to know about our decision.
 */
class SentryParentSampler implements Sampler {
  private _root: Sampler;
  constructor(config: { root: Sampler }) {
    this._root = config.root;
  }

  /**
   * Checks whether span needs to be created and tracked.
   *
   * @param context Parent Context which may contain a span.
   * @param traceId of the span to be created. It can be different from the
   *     traceId in the {@link SpanContext}. Typically in situations when the
   *     span to be created starts a new trace.
   * @param spanName of the span to be created.
   * @param spanKind of the span to be created.
   * @param attributes Initial set of SpanAttributes for the Span being constructed.
   * @param links Collection of links that will be associated with the Span to
   *     be created. Typically useful for batch operations.
   * @returns a {@link SamplingResult}.
   */
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: SpanAttributes,
    links: Link[],
  ): SamplingResult {
    const decision = this._root.shouldSample(
      context,
      traceId,
      spanName,
      spanKind,
      attributes,
      links,
    );
    return wrapSamplingDecision({
      decision: decision.decision,
      context,
      spanAttributes: attributes,
    });
  }

  toString() {
    return SentryParentSampler.name;
  }
}

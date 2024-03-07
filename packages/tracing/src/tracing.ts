import process from 'process';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { DataloaderInstrumentation } from '@opentelemetry/instrumentation-dataloader';
import {
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
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-node';
import { ExpressLayerType } from '@opentelemetry/instrumentation-express/build/src/enums/ExpressLayerType';

export type TracingConfig = {
  serviceName: string;
  release: string;
  samplingRatio?: number;
  graphQLDepth?: number;
  grpcDefaultPort?: number;
  httpDefaultPort?: number;
  host?: string;
  logger?: DiagLogger;
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
};

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
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: config.release,
    }),
  );

  const _traceExporter = new OTLPTraceExporter({
    //collector url
    url: `http://${config.host}:${config.grpcDefaultPort}`,
  });
  const _spanProcessor = new BatchSpanProcessor(_traceExporter, {
    // only force 100ms between 2 batch exports.
    // Default is 5000ms which is 5 seconds and causes us to lose spans
    scheduledDelayMillis: 100,
  });
  const _idGenerator = new AWSXRayIdGenerator();

  const sdk = new NodeSDK({
    textMapPropagator: new AWSXRayPropagator(),
    instrumentations: [
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
      new KnexInstrumentation({}),
      new MySQL2Instrumentation({}),
      new NetInstrumentation({}),
    ],
    resource: _resource,
    spanProcessor: _spanProcessor,
    traceExporter: _traceExporter,
    idGenerator: _idGenerator,
    sampler: new ParentBasedSampler({
      //set at 20% sampling rate
      root: new TraceIdRatioBasedSampler(config.samplingRatio),
    }),
  });

  // this enables the API to record telemetry
  await sdk.start();

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

import process from 'process';

import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { DataloaderInstrumentation } from '@opentelemetry/instrumentation-dataloader';
import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { ExpressLayerType } from '@opentelemetry/instrumentation-express/build/src/enums/ExpressLayerType';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex';
import { MySQLInstrumentation } from '@opentelemetry/instrumentation-mysql';
import { MySQL2Instrumentation } from '@opentelemetry/instrumentation-mysql2';
import { NetInstrumentation } from '@opentelemetry/instrumentation-net';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import config from './config/index';

/**
 * documentation:https://aws-otel.github.io/docs/getting-started/js-sdk/trace-manual-instr#instrumenting-the-aws-sdk
 * and https://github.com/open-telemetry/opentelemetry-js
 * sample apps: https://github.com/aws-observability/aws-otel-community/blob/master/sample-apps/javascript-sample-app/nodeSDK.js
 */
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

const _resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.sentry.release,
  }),
);

const _traceExporter = new OTLPTraceExporter({
  url: `http://${config.tracing.host}:${config.tracing.grpcDefaultPort}`,
});
const _spanProcessor = new BatchSpanProcessor(_traceExporter);
const _tracerConfig = {
  idGenerator: new AWSXRayIdGenerator(),
};

/**
 * function to setup open-telemetry tracing config
 * Note: this function has to run before initial
 * server start and import to patch all libraries
 */
export async function nodeSDKBuilder() {
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
        depth: config.tracing.graphQLDepth,
        allowValues: true,
      }),
      new HttpInstrumentation({
        ignoreIncomingPaths: ['/.well-known/apollo/server-health'],
      }),
      new KnexInstrumentation({}),
      new MySQLInstrumentation({}),
      new MySQL2Instrumentation({}),
      new NetInstrumentation({}),
    ],
    resource: _resource,
    spanProcessor: _spanProcessor,
    traceExporter: _traceExporter,
    sampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(config.tracing.samplingRatio),
    }),
  });
  sdk.configureTracerProvider(_tracerConfig, _spanProcessor);

  await sdk.start();

  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing and Metrics terminated'))
      .catch((error) =>
        console.log('Error terminating tracing and metrics', error),
      )
      .finally(() => process.exit(0));
  });
}

module.exports = { nodeSDKBuilder };

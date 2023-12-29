import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { AwsLambdaInstrumentation } from '@opentelemetry/instrumentation-aws-lambda';
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { DataloaderInstrumentation } from '@opentelemetry/instrumentation-dataloader';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex';
import { MySQL2Instrumentation } from '@opentelemetry/instrumentation-mysql2';
import { NetInstrumentation } from '@opentelemetry/instrumentation-net';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import config from './config';

import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-node';
import { ExpressLayerType } from '@opentelemetry/instrumentation-express/build/src/enums/ExpressLayerType';
import { serverLogger } from './server';

/**
 * documentation:https://aws-otel.github.io/docs/getting-started/js-sdk/trace-manual-instr#instrumenting-the-aws-sdk
 * and https://github.com/open-telemetry/opentelemetry-js
 * sample apps: https://github.com/aws-observability/aws-otel-community/blob/master/sample-apps/javascript-sample-app/nodeSDK.js
 */

const _resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.sentry.release,
  }),
);

const _traceExporter = new OTLPTraceExporter({
  //collector url
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
      new AwsLambdaInstrumentation(),
      new DataloaderInstrumentation(),
      new HttpInstrumentation({
        ignoreIncomingPaths: ['/.well-known/apollo/server-health'],
      }),
      new ExpressInstrumentation({
        ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
      }),
      new GraphQLInstrumentation({
        // optional params
        depth: config.tracing.graphQLDepth, //query depth
        allowValues: true,
      }),
      new KnexInstrumentation(),
      new MySQL2Instrumentation(),
      new NetInstrumentation(),
    ],
    resource: _resource,
    spanProcessor: _spanProcessor,
    traceExporter: _traceExporter,
    sampler: new ParentBasedSampler({
      //set at 20% sampling rate
      root: new TraceIdRatioBasedSampler(config.tracing.samplingRatio),
    }),
  });
  sdk.configureTracerProvider(_tracerConfig, _spanProcessor);

  // this enables the API to record telemetry
  await sdk.start();

  // gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() =>
        serverLogger.info({ message: 'Tracing and Metrics terminated' }),
      )
      .catch((error) =>
        serverLogger.error('Error terminating tracing and metrics', {
          error: error,
        }),
      )
      .finally(() => process.exit(0));
  });
  //todo: export tracer object to enable/test custom tracing
}

module.exports = { nodeSDKBuilder };

import config from '../config';
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { diag } from '@opentelemetry/api';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { ExpressLayerType } from '@opentelemetry/instrumentation-express/build/src/enums/ExpressLayerType';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NetInstrumentation } from '@opentelemetry/instrumentation-net';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { serverLogger } from './express';

/**
 * documentation:https://aws-otel.github.io/docs/getting-started/js-sdk/trace-manual-instr#instrumenting-the-aws-sdk
 * and https://github.com/open-telemetry/opentelemetry-js
 * sample apps: https://github.com/aws-observability/aws-otel-community/blob/master/sample-apps/javascript-sample-app/nodeSDK.js
 */

//tracing level set for open-telemetry
diag.setLogger(serverLogger);

const _resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.sentry.release,
  })
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
      new ExpressInstrumentation({
        ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
      }),
      new HttpInstrumentation({
        ignoreIncomingPaths: ['/.well-known/apollo/server-health'],
      }),
      new NetInstrumentation({}),
      //Note: please don't add graphQL instrumentation
      //as this is a gateway service
      //documentation: https://www.apollographql.com/docs/federation/opentelemetry/
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
      .then(() => serverLogger.info('Tracing and Metrics terminated'))
      .catch((error) =>
        serverLogger.error({
          message: 'Error terminating tracing and metrics',
          error,
        })
      )
      .finally(() => process.exit(0));
  });
  //todo: export tracer object to enable/test custom tracing
}

module.exports = { nodeSDKBuilder };

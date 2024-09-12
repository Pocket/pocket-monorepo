import { SageMakerRuntimeClient } from '@aws-sdk/client-sagemaker-runtime'; // ES Modules import
import { Agent } from 'http';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { ConfiguredRetryStrategy } from '@smithy/util-retry';

let _sagemakerClient: SageMakerRuntimeClient;
export const sagemakerClient = () => {
  if (_sagemakerClient == null) {
    _sagemakerClient = new SageMakerRuntimeClient({
      requestHandler: new NodeHttpHandler({
        httpAgent: new Agent({
          keepAlive: true,
          maxSockets: 10,
        }),
        socketTimeout: 70 * 1000, // ms
        connectionTimeout: 5000,
      }),
      retryStrategy: new ConfiguredRetryStrategy(
        3, // max attempts
        (attempt: number) => 75 + attempt * 100, // backoff
      ),
    });
    return _sagemakerClient;
  } else {
    return _sagemakerClient;
  }
};

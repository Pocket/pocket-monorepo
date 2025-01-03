import {
  SageMakerRuntimeClient,
  InvokeEndpointCommand,
  InvokeEndpointCommandInput,
} from '@aws-sdk/client-sagemaker-runtime'; // ES Modules import
import { Agent } from 'http';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { config } from './config.ts';
import * as Sentry from '@sentry/aws-serverless';
import { ParserResult } from './types.ts';
import { ConfiguredRetryStrategy } from '@smithy/util-retry';

let _sagemakerClient: SageMakerRuntimeClient;
const sagemakerClient = () => {
  if (_sagemakerClient == null) {
    _sagemakerClient = new SageMakerRuntimeClient({
      requestHandler: new NodeHttpHandler({
        // Reuse connections to reduce overhead;
        // Lambda is bounded and ephemeral
        httpAgent: new Agent({
          keepAlive: true,
          maxSockets: Infinity,
        }),
        socketTimeout: 70 * 1000, // ms
        connectionTimeout: 70 * 1000, // ms
      }),
      retryStrategy: new ConfiguredRetryStrategy(
        4, // max attempts
        (attempt: number) => 100 + attempt * 1000, // backoff
      ),
    });
    return _sagemakerClient;
  } else {
    return _sagemakerClient;
  }
};

export async function getEmbeddings(
  document: Pick<ParserResult, 'given_url' | 'title' | 'excerpt'>,
) {
  const client = sagemakerClient();
  const joinedDoc = [
    // Remove leading and trailing whitespace, and the final period from the title
    // (will be re-added if one exists)
    document.title?.trim().replace(/\.$/, ''),
    document.excerpt?.trim(),
  ]
    .filter((_) => _ != null && _.length > 0)
    .join('. ');
  if (joinedDoc.length === 0) {
    return undefined;
  }
  const input: InvokeEndpointCommandInput = {
    EndpointName: config.sagemakerEndpoint,
    ContentType: 'application/json',
    Body: Buffer.from(JSON.stringify({ inputs: joinedDoc })),
  };
  Sentry.addBreadcrumb({
    data: { url: document.given_url, input: joinedDoc },
  });
  const command = new InvokeEndpointCommand(input);
  try {
    const response = await client.send(command);
    const vector = JSON.parse(response.Body.transformToString());
    // Probably should never be null/malformed without error, but ensure
    if (vector?.[0]?.[0]?.length > 0) {
      // Return [CLS] token
      return vector[0][0];
    }
    Sentry.captureException('Received malformed data from Sagemaker endpoint', {
      data: { endpoint: config.sagemakerEndpoint, response, input: joinedDoc },
    });
    return undefined;
  } catch (error) {
    // Don't halt the program, but we do want to capture the exception
    Sentry.captureException(error);
    return undefined;
  }
}

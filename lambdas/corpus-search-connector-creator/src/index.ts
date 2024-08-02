import { serverLogger } from '@pocket-tools/ts-logger';
import { config } from './config';
import { setTimeout } from 'timers/promises';
import * as Sentry from '@sentry/aws-serverless';
Sentry.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
  environment: config.sentry.environment,
});
import { Handler } from 'aws-lambda';

type EventPayload = {
  // Endpoint for invoking the SageMaker model
  sagemakerEndpoint: string;
  // The role used to create the connection;
  // must have access to both OpenSearch and Sagemaker
  osRoleArn: string;
  // OpenSearch cluster host
  osHost: string;
  // Name of the SageMaker model
  modelName: string;
  // Token limit of model
  tokenLimit: number;
  // Name of the ingest pipeline (created in OS)
  pipelineName: string;
  // Indices to associate with this text embedding model
  // (will create if do not exist)
  // Name of index and language-specific analyzer
  indices: [{ name: string; analyzer: string }];
};

/**
 * The main handler function which will be wrapped by Sentry prior to export.
 * Processes messages originating from event bridge. The detail-type field in
 * the message is used to determine which handler should be used for processing.
 * @param event
 * @returns
 */
export const processor: Handler<EventPayload> = async (event, context) => {
  serverLogger.debug({ message: 'Event received by lambda', data: event });
  const region = context.invokedFunctionArn.split(':')[3];
  const connectorId = await createConnector(
    event.osHost,
    event.sagemakerEndpoint,
    event.osRoleArn,
    region,
  );
  const modelId = await registerModel(
    connectorId,
    event.osHost,
    event.modelName,
  );
  await createPipeline(
    event.pipelineName,
    modelId,
    event.tokenLimit,
    event.osHost,
  );
  for await (const { name, analyzer } of event.indices) {
    if (!(await indexExists(name, event.osHost))) {
      createIndex(name, analyzer, event.tokenLimit, event.osHost);
    }
  }
  return JSON.stringify({
    modelId,
    connectorId,
    pipelineName: event.pipelineName,
    modelEndpoint: event.sagemakerEndpoint,
  });
};

export const handler = Sentry.wrapHandler(processor);

const connectorAction = (modelEndpoint: string) => {
  return {
    action_type: 'predict',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    url: modelEndpoint,
    request_body: '{ "inputs": "${parameters.input}"}',
  };
};

async function createConnector(
  host: string,
  modelEndpoint: string,
  osRoleArn: string,
  region: string,
) {
  const connectorUrl = new URL(
    '_plugins/_ml/connectors/_create',
    host,
  ).toString();
  const payload = {
    name: 'Sagemaker Connector: embedding',
    description: 'The connector to sagemaker embedding model',
    version: 1,
    protocol: 'aws_sigv4',
    credential: { roleArn: osRoleArn },
    parameters: { region: region, service_name: 'sagemaker' },
    actions: [connectorAction(modelEndpoint)],
  };
  const result = await fetch(connectorUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const connectorResponse = await result.json();
  const data = {
    message: 'Create connector response',
    data: connectorResponse,
  };
  serverLogger.debug(data);
  Sentry.addBreadcrumb({ data });
  if (!connectorResponse.ok) {
    const error = new Error('Failed to create connector');
    serverLogger.error(error.message);
    Sentry.captureException(error);
    throw error;
  }
  return connectorResponse['connector_id'];
}

async function registerModel(
  connectorId: string,
  host: string,
  modelName: string,
): Promise<string> {
  const url = new URL(
    '_plugins/_ml/models/_register?deploy=true',
    host,
  ).toString();
  const payload = {
    name: modelName,
    function_name: 'remote',
    description: `"Sagemaker Model for connector ${connectorId}"`,
    connector_id: connectorId,
  };
  const result = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const modelResponse = await result.json();
  const data = { message: 'Create model response', data: modelResponse };
  serverLogger.debug(data);
  Sentry.addBreadcrumb({ data });
  if (result.ok) {
    const taskId = modelResponse['task_id'];
    // There can be a slight delay, so wait a second before requesting task status
    await setTimeout(1000);
    return modelByTask(taskId, host);
  } else {
    const error = new Error('Failed to create model');
    Sentry.captureException(error);
    serverLogger.error(error.message);
    throw error;
  }
}

async function modelByTask(taskId: string, host: string): Promise<string> {
  const url = new URL(`_plugins/_ml/tasks/${taskId}`, host).toString();
  const result = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (result.ok) {
    return (await result.json())['model_id'];
  } else {
    const error = new Error(
      `Failed to get model_id from task (status=${result.status})`,
    );
    Sentry.captureException(error);
    serverLogger.error(error.message);
    throw error;
  }
}

async function createPipeline(
  pipelineName: string,
  modelId: string,
  tokenLimit: number,
  host: string,
) {
  const url = new URL(`_ingest/pipeline/${pipelineName}`, host).toString();
  const payload = {
    description: 'A text chunking and embedding ingest pipeline',
    processors: [
      {
        text_chunking: {
          algorithm: {
            fixed_token_length: {
              token_limit: tokenLimit,
              overlap_rate: 0.2,
              tokenizer: 'standard',
            },
          },
          field_map: {
            passage_text: 'passage_chunk',
          },
        },
      },
      {
        ml_inference: {
          model_id: modelId,
          function_name: 'remote',
          input_map: [
            {
              inputs: 'passage_chunk',
            },
          ],
          output_map: [
            {
              passage_chunk_embedding: 'data',
            },
          ],
        },
      },
    ],
  };
  const result = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const response = await result.json();
  const data = { message: 'Create pipeline response', data: response };
  serverLogger.debug(data);
  Sentry.addBreadcrumb({ data });
  if (result.ok) {
    return;
  } else {
    const error = new Error(`Failed to create pipeline`);
    Sentry.captureException(error);
    serverLogger.error(error.message);
    throw error;
  }
}

async function indexExists(name: string, host: string): Promise<boolean> {
  const url = new URL(name, host).toString();
  const result = await fetch(url, {
    method: 'HEAD',
  });
  if (result.ok) {
    return true;
  } else {
    return false;
  }
}

async function createIndex(
  indexName: string,
  analyzer: string,
  tokenLimit: number,
  host: string,
) {
  const url = new URL(`_ingest/${indexName}`, host).toString();
  const payload = {
    settings: {
      index: {
        knn: true,
      },
    },
    mappings: {
      properties: {
        pocket_parser_extracted_text: {
          type: 'text',
        },
        passage_chunk: {
          type: 'text',
        },
        passage_chunk_embedding: {
          type: 'nested',
          properties: {
            knn: {
              type: 'knn_vector',
              dimension: tokenLimit,
            },
          },
        },
        corpusId: {
          type: 'keyword',
          index: false,
        },
        title: {
          type: 'text',
          analyzer,
        },
        status: {
          type: 'keyword',
        },
        url: {
          type: 'text',
        },
        excerpt: {
          type: 'text',
          analyzer,
        },
        is_syndicated: {
          type: 'boolean',
        },
        language: {
          type: 'keyword',
        },
        publisher: {
          type: 'text',
          analyzer: 'simple',
        },
        topic: {
          type: 'keyword',
        },
        authors: {
          type: 'text',
          analyzer: 'simple',
        },
        created_at: {
          type: 'date',
          format: 'strict_date_optional_time||epoch_second',
        },
        published_at: {
          type: 'date',
          format: 'strict_date_optional_time||epoch_second',
        },
        is_collection: {
          type: 'boolean',
        },
        collection_labels: {
          type: 'keyword',
        },
        curation_category: {
          type: 'keyword',
        },
        iab_parent: {
          type: 'keyword',
        },
        iab_child: {
          type: 'keyword',
        },
        parent_collection_id: {
          type: 'keyword',
          index: false,
        },
        curation_source: {
          type: 'keyword',
          index: true,
        },
        quality_rank: {
          type: 'byte',
          index: true,
        },
        est_time_to_consume_minutes: {
          type: 'integer',
          index: true,
        },
        content_type_parent: {
          type: 'keyword',
          index: true,
        },
        content_type_children: {
          type: 'keyword',
          index: true,
        },
        pocket_item_id: {
          type: 'long',
          index: false,
        },
        pocket_resolved_id: {
          type: 'long',
          index: false,
        },
        pocket_normal_url: {
          type: 'keyword',
          index: false,
        },
        pocket_resolved_url: {
          type: 'keyword',
          index: false,
        },
        pocket_parser_request_given_url: {
          type: 'keyword',
          index: false,
        },
      },
    },
  };
  const result = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const response = await result.json();
  const data = { message: 'Create index response', data: response, indexName };
  serverLogger.debug(data);
  Sentry.addBreadcrumb({ data });
  if (result.ok) {
    return;
  } else {
    const error = new Error(`Failed to create index`);
    Sentry.captureException(error);
    serverLogger.error(error.message);
    throw error;
  }
}

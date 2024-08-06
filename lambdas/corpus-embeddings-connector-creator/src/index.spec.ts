import { handler } from '.';

describe('placeholder', () => {
  it('runs', async () => {
    const event = {
      sagemakerEndpoint:
        'https://runtime.sagemaker.us-east-1.amazonaws.com/endpoints/distilbert-ep-otljwlya/invocations',
      osRoleArn:
        'arn:aws:iam::410318598490:role/CorpusEmbeddings-Dev-OSMLConnector',
      osHost:
        'https://vpc-corpusembeddings-dev-fdfohyy4ixwvv3na4o6yxfubmi.us-east-1.es.amazonaws.com',
      modelName: 'distilbert-msmarco',
      tokenLimit: 384,
      pipelineName: 'corpus-en-distilbert-ingest',
      indices: [{ name: 'corpus_en', analyzer: 'english' }],
    };
    const res = await handler(
      event as any,
      {
        invokedFunctionArn:
          'arn:aws:lambda:us-east-1:410318598490:function:CorpusEmbeddings-Dev-CreateMlConnector',
      } as any,
      undefined,
    );
  });
});

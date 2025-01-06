import { SQSRecord } from 'aws-lambda';
import { sqsLambdaEventBridgeEvent } from '../../utils.ts';
import { PocketEventType } from '../events.ts';
import { CollectionCreated } from './collection.ts';

describe('collection event', () => {
  it('throw an error if collection event payload is missing collection', async () => {
    const recordWithoutEmail = {
      body: JSON.stringify({
        Message: JSON.stringify({
          account: '12345',
          id: '12345',
          region: 'us-west-2',
          time: '2021-08-12T20:05:00Z',
          version: '1.0',
          source: 'collection-event',
          'detail-type': PocketEventType.COLLECTION_CREATED,
          detail: {},
        }),
      }),
    };
    expect.assertions(1); // since it's in a try/catch, make sure we assert
    try {
      const event = sqsLambdaEventBridgeEvent(recordWithoutEmail as SQSRecord);
      console.log(event);
    } catch (e) {
      expect(e.message).toContain(
        "data/detail must have required property 'collection'",
      );
    }
  });

  it('removes empty objects', async () => {
    const recordWithNumberBool = {
      body: JSON.stringify({
        Message: JSON.stringify({
          account: '12345',
          id: '12345',
          region: 'us-west-2',
          time: '2021-08-12T20:05:00Z',
          version: '1.0',
          source: 'collection-event',
          'detail-type': PocketEventType.COLLECTION_CREATED,
          detail: {
            collection: {
              externalId: '12',
              slug: 'a-cool-slug',
              title: 'A cool title',
              status: 'published',
              language: 'EN',
              authors: [],
              stories: [],
              createdAt: 123456789,
              updatedAt: 123456789,
              IABParentCategory: {},
            },
          },
        }),
      }),
    };
    const event: CollectionCreated = (await sqsLambdaEventBridgeEvent(
      recordWithNumberBool as SQSRecord,
    )) as CollectionCreated;
    expect(event.detail.collection.IABChildCategory).toBe(undefined);
  });
});

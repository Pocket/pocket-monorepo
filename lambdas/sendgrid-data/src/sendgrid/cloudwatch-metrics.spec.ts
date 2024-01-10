import { Event, EventType } from './event';
import {
  decorateEvent,
  deliver,
  DimensionMapping,
  eventToMetrics,
  mapEventToMetricName,
  getMetricWithDimensions,
} from './cloudwatch-metrics';
import config from '../config';
import { CloudWatchClient, MetricDatum } from '@aws-sdk/client-cloudwatch';

/**
 * Note: without done(), the tests fail with this error:
 *
 * > Error: Timeout of 2000ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.
 *
 * Unclear how to resolve the promise with mocks (or how the firehose tests don't need the explicit done() call)
 */

describe('cloudwatch metrics', () => {
  const metricsPerEvent = 1 + config.aws.cloudwatch.metricDimensions.length;

  describe('generate metric data', () => {
    const time = new Date();
    const dimMap: DimensionMapping[] = [
      { weight: 'Weight' },
      { weight: 'Weight', randomKey: 'HEIGHT' },
      { accountId: 'AccountId' },
    ];
    const event: Event = {
      event: 'spamreport',
      email: 'anyone',
      timestamp: time.getTime() / 1000, // remove milliseconds
      weight: 100,
      randomKey: 'hello',
    };
    const baseMetric: MetricDatum = {
      MetricName: 'metric',
    };

    it('correctly maps event properties to dimensions', () => {
      const metric = getMetricWithDimensions(event, baseMetric, dimMap[1]);
      expect(metric).toStrictEqual({
        MetricName: 'metric',
        Dimensions: [
          {
            Name: 'Weight',
            Value: '100',
          },
          {
            Name: 'HEIGHT',
            Value: 'hello',
          },
        ],
      });
    });

    it('correctly generates expected number of metrics', () => {
      const metrics = eventToMetrics(event, dimMap);
      expect(metrics.length).toEqual(1 + dimMap.length);
    });

    it('correctly injects whitelisted parameters into the event data', () => {
      const evt = decorateEvent(event, { accountId: 5, userId: 6 });
      expect(evt.accountId).toEqual(5);
      expect(evt.userId).toBeUndefined();
    });

    it('maps EventType.bounce (sendgrid.event.type=blocked) to EventType.bounced', () => {
      const blockEvent = {
        ...event,
        event: 'bounce' as EventType,
        type: 'blocked',
      };
      const eventName = mapEventToMetricName(blockEvent);
      expect(eventName).toEqual('blocked');
    });
  });

  describe('put metric data', () => {
    let spy: jest.SpyInstance;

    const EVENTS: Event[] = [
      {
        event: 'bounce',
        timestamp: new Date().getTime(),
        email: 'email1@mail.com',
        campaign: 'test',
      },
      {
        event: 'spamreport',
        timestamp: new Date().getTime(),
        email: 'email2@mail.com',
        campaign: 'test',
      },
    ];

    // holds X events that should generate Y metrics (targeting X * Y > 20)
    const EVENTS_OVER_20: Event[] = [];
    while (EVENTS_OVER_20.length * metricsPerEvent <= 20) {
      EVENTS_OVER_20.push(EVENTS[0]);
    }

    beforeEach(() => {
      spy = jest.spyOn(CloudWatchClient.prototype, 'send');
      spy.mockResolvedValueOnce(() => {
        Promise.resolve();
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('sends a single request per campaign when metrics <= 20', async () => {
      await deliver(EVENTS);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('delivers expected number of events', async () => {
      await deliver(EVENTS);
      const payload = spy.mock.calls[0];
      expect(payload[0].input.MetricData.length).toEqual(
        EVENTS.length * metricsPerEvent,
      );
    });

    it('aggregates events of the same type to create metrics and send a single request', async () => {
      await deliver(EVENTS_OVER_20);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('has the necessary metric dimensions configured', () => {
      expect(config.aws.cloudwatch.metricDimensions).toEqual([
        { accountId: 'AccountId' },
        { accountId: 'AccountId', computedCampaignName: 'Campaign' },
      ]);
    });

    it('aggregates events per campaign', async () => {
      const events: any = [];
      const eventsToGenerate: any = {
        test1: { delivered: 1000, open: 250, click: 100, processed: 1000 }, // 12
        test2: { delivered: 500, open: 200 }, // 6
        test3: { delivered: 2000 }, // 3
        test4: { delivered: 4000 }, // 3
        test5: { delivered: 1500 }, // 3
        test6: { delivered: 5000 }, // 3
        test7: { delivered: 3500 }, // 3
      };

      // generate events to be delivered | 19050 events
      Object.keys(eventsToGenerate).forEach((campaign: any) => {
        Object.keys(eventsToGenerate[campaign]).forEach((event: any) => {
          for (let i = 0; i < eventsToGenerate[campaign][event]; i++) {
            events.push({
              event: event,
              timestamp: 1473796636,
              campaign: campaign,
            });
          }
        });
      });

      await deliver(events as any, { accountId: 'testAccountId' });

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});

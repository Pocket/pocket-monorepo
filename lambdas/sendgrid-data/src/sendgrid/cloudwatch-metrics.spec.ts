import AWSMock from 'aws-sdk-mock';
import { Event, EventType } from './event';
import {
  decorateEvent,
  deliver,
  DimensionMapping,
  eventToMetrics,
  mapEventToMetricName,
  getMetricWithDimensions,
} from './cloudwatch-metrics';
import { expect } from 'chai';
import 'mocha';
import config from '../config';
import sinon, { SinonSpyStatic } from 'sinon';
import { MetricDatum } from 'aws-sdk/clients/cloudwatch';

/**
 * Note: without done(), the tests fail with this error:
 *
 * > Error: Timeout of 2000ms exceeded. For async tests and hooks, ensure "done()" is called; if returning a Promise, ensure it resolves.
 *
 * Unclear how to resolve the promise with mocks (or how the firehose tests don't need the explicit done() call)
 */

describe('cloudwatch metrics', async (): Promise<any> => {
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
      expect(metric).to.deep.include({
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
      expect(metrics.length).to.equal(1 + dimMap.length);
    });

    it('correctly injects whitelisted parameters into the event data', () => {
      const evt = decorateEvent(event, { accountId: 5, userId: 6 });
      expect(evt.accountId).to.equal(5);
      expect(evt.userId).to.equal(undefined);
    });

    it('maps EventType.bounce (sendgrid.event.type=blocked) to EventType.bounced', () => {
      const blockEvent = {
        ...event,
        event: 'bounce' as EventType,
        type: 'blocked',
      };
      const eventName = mapEventToMetricName(blockEvent);
      expect(eventName).to.equal('blocked');
    });
  });

  describe('put metric data', async (): Promise<any> => {
    const sandbox = sinon.createSandbox();
    let spy: SinonSpyStatic | any;

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
      spy = sandbox.spy();
      AWSMock.mock('CloudWatch', 'putMetricData', spy);
    });

    afterEach(() => {
      sandbox.restore();
      AWSMock.restore();
    });

    it('sends a single request per campaign when metrics <= 20', async (done: any): Promise<
      any
    > => {
      deliver(EVENTS);
      expect(spy.callCount).to.equal(1);
      done();
    });

    it('delivers expected number of events', async (done: any): Promise<
      any
    > => {
      deliver(EVENTS);
      const payload = spy.getCall(0).args[0];
      expect(payload.MetricData.length).to.equal(
        EVENTS.length * metricsPerEvent
      );
      done();
    });

    it('aggregates events of the same type to create metrics and send a single request', async (done: any): Promise<
      any
    > => {
      deliver(EVENTS_OVER_20);
      expect(spy.callCount).to.equal(1);
      done();
    });

    it('has the necessary metric dimensions configured', () => {
      expect(config.aws.cloudwatch.metricDimensions).to.have.deep.members([
        { accountId: 'AccountId' },
        { accountId: 'AccountId', computedCampaignName: 'Campaign' },
      ]);
    });

    it('aggregates events per campaign', () => {
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

      deliver(events as any, { accountId: 'testAccountId' });

      expect(spy.callCount).to.equal(2);
    });
  });
});

import { deliver as deliverFirehose } from './firehose.ts';
import { deliver as deliverMetrics } from './cloudwatch-metrics.ts';
import { serverLogger } from '@pocket-tools/ts-logger';

export const logEventsReceived = (events: any) => {
  let _ev = events;
  if (!(events instanceof Array)) {
    _ev = [events];
  }

  serverLogger.info(
    `sendgridData: received ${_ev.length} events; 0.id = ${_ev[0].sg_event_id}`,
  );
};

export const logEventsError = (events: any) => {
  let _ev = events;
  if (!(events instanceof Array)) {
    _ev = [events];
  }

  serverLogger.error(
    `sendgridData: error detected; 0.id = ${_ev[0].sg_event_id}`,
  );
};

export const deliverEvents = async (
  events: any,
  queryParams: { [key: string]: any },
): Promise<boolean> => {
  const firehosePromise = deliverFirehose(events, queryParams);
  const metricsPromise = deliverMetrics(events, queryParams);

  return await Promise.all([firehosePromise, metricsPromise]).then(() => true);
};

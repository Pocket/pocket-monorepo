import {
  MetricDatum,
  Dimension,
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import config from '../config/index.js';
import { Event } from './event.js';
import { chunkArray } from './util.js';
import { addBreadcrumbs, captureException } from '../sentry.js';

export type DimensionMapping = {
  [key: string]: any;
};

/**
 * Injects specific keys from the parameters into the event object.
 *
 * @param event
 * @param parameters
 */
export const decorateEvent = (event: Event, parameters: any): Event => {
  const { accountId } = parameters;

  // SendGrid based on how the marketing campaign is created either sends events to the webhook
  // with the campaign name as `marketing_campaign_name` or `campaign`.
  // We are checking for which one is available in the event and using that as our metric.
  const computedCampaignName = event.campaign || event.marketing_campaign_name;

  return { ...event, accountId, computedCampaignName };
};

const MISSING_DIMENSION_VALUE = 'none';

/**
 * Maps an event's property to a named dimension and uses the property's value as the dimension value.
 * If the property doesn't exist, use {@see MISSING_DIMENSION_VALUE} as the value.
 *
 * @param event
 * @param baseMetric
 * @param dimensionMap
 */
export const getMetricWithDimensions = (
  event: Event,
  baseMetric: MetricDatum,
  dimensionMap: DimensionMapping,
): MetricDatum => {
  const dims: Dimension[] = [];
  for (const eventKey in dimensionMap) {
    // we need to coerce properties to string
    const dimension = dimensionMap[eventKey];
    dims.push({
      Name: dimension,
      Value: '' + (event[eventKey] ?? MISSING_DIMENSION_VALUE),
    });
  }

  return { ...baseMetric, Dimensions: dims };
};

export const mapEventToMetricName = (event: Event): string => {
  if (event.event === 'bounce' && event.type === 'blocked') {
    return 'blocked';
  }

  return event.event;
};

/**
 * Returns 1+ metrics based on an event and its dimension mappings.
 */
export const eventToMetrics = (
  event: Event,
  dimensions?: DimensionMapping[],
): MetricDatum[] => {
  const dims = dimensions ?? [];
  const metrics: MetricDatum[] = [];
  const baseMetric = {
    MetricName: mapEventToMetricName(event),
    Value: event.value,
    Timestamp: new Date(event.timestamp * 1000),
  };
  metrics.push(baseMetric);

  dims.forEach((map: DimensionMapping) => {
    metrics.push(getMetricWithDimensions(event, baseMetric, map));
  });

  return metrics;
};

/**
 * Executes cloudwatch request. Any exceptions are caught and sent to Sentry along with `metrics` payload.
 *
 * @param cloudwatch
 * @param metrics
 */
const putMetrics = (
  cloudwatch: CloudWatchClient,
  metrics: MetricDatum[],
): Promise<any> => {
  // timestamp each breadcrumb so that we can properly tie it back to a specific error
  const reqTimestamp = new Date().getTime();

  addBreadcrumbs({
    type: `cloudwatch-metrics:deliver/request/${reqTimestamp}/start`,
    data: { metrics },
  });

  return cloudwatch
    .send(
      new PutMetricDataCommand({
        Namespace: config.aws.cloudwatch.metricNamespace,
        MetricData: metrics,
      }),
    )
    .catch((err: any) => {
      captureException(err, {
        type: `cloudwatch-metrics:deliver/request/${reqTimestamp}/error`,
      });
      console.error(err, { metrics });
    });
};

/**
 * Aggregates events per request by campaign
 *
 * @param aggregatedEvents
 * @param event
 */
const aggregateEvents = (aggregatedEvents: any, event: any): Array<any> => {
  const eventType = event.event;
  const campaignName = event.computedCampaignName;

  if (!aggregatedEvents[campaignName]) {
    aggregatedEvents[campaignName] = [];
  }

  if (!aggregatedEvents[campaignName][eventType]) {
    aggregatedEvents[campaignName][eventType] = { ...event, value: 1 };
    return aggregatedEvents;
  }

  aggregatedEvents[campaignName][eventType].value += 1;

  return aggregatedEvents;
};

/**
 * For each event type we create the metrics then create requests with a maximum of 20 metrics per request.
 *
 * @param cloudwatch
 * @param aggregatedEvents
 */
const createRequests = (
  cloudwatch: CloudWatchClient,
  aggregatedEvents: any,
): Array<Promise<any>> => {
  const dimensionMappings: DimensionMapping[] =
    config.aws.cloudwatch.metricDimensions;
  const promises: Array<Promise<any>> = [];
  const cloudwatchMetricsPerRequest = config.aws.cloudwatch.metricsPerRequest;
  const metrics: MetricDatum[] = [];

  Object.keys(aggregatedEvents).forEach((campaignName: any) => {
    const aggregatedEvent = aggregatedEvents[campaignName];

    Object.keys(aggregatedEvent).forEach((eventName: any) => {
      const event = aggregatedEvent[eventName];
      eventToMetrics(event, dimensionMappings).forEach((metric: MetricDatum) =>
        metrics.push(metric),
      );
    });
  });

  for (
    let start = 0;
    start < metrics.length;
    start += cloudwatchMetricsPerRequest
  ) {
    const chunkedMetrics = metrics.slice(
      start,
      start + cloudwatchMetricsPerRequest,
    );
    promises.push(putMetrics(cloudwatch, chunkedMetrics));
  }

  return promises;
};

/**
 * Converts a set of events into metrics and sends them all to Cloudwatch.
 *
 * @param events
 * @param parameters Additional key-value pairs that will be injected into each event. Use this to pass accountId or
 * other data not available in sendgrid events.
 */
export const deliver = async (
  events: Event[],
  parameters?: { [key: string]: any },
): Promise<boolean> => {
  const params = parameters ?? {};
  const cloudwatch = new CloudWatchClient({
    maxAttempts: config.aws.maxRetries,
  });
  const eventChunks = chunkArray(events, 500);
  let eventChunk = eventChunks.next();
  let aggregatedEvents: any = {};

  while (!eventChunk.done) {
    eventChunk.value.forEach((event: Event) => {
      event = decorateEvent(event, params);
      aggregatedEvents = aggregateEvents(aggregatedEvents, event);
    });

    eventChunk = eventChunks.next();
  }

  const promises = createRequests(cloudwatch, aggregatedEvents);

  return Promise.all(promises)
    .then((results: any[]) => {
      return true;
    })
    .catch((err: any) => {
      captureException(err, { type: 'cloudwatch-metrics:deliver/generic-all' });
      return false;
    });
};

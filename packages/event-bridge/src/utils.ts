import { SQSRecord } from 'aws-lambda';
import { PocketEventTypeMap, Event } from './events';

// This function is used to parse the event data from the event bridge from a json object to a PocketEvent object
export const parsePocketEvent = <T extends keyof PocketEventTypeMap>(
  json: PocketEventTypeMap[T],
): PocketEventTypeMap[T] => {
  if (!json || !(json['detail-type'] in Object.keys(Event))) {
    throw new Error(`Unsupported type: ${json['detail-type']}`);
  }
  return json as PocketEventTypeMap[T];
};

export const sqsEventBridgeEvent = <T extends keyof PocketEventTypeMap>(
  record: SQSRecord,
): PocketEventTypeMap[T] | null => {
  const message = JSON.parse(JSON.parse(record.body).Message);
  // TODO: Event validation of fields
  return parsePocketEvent(message);
};

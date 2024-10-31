import { SQSRecord } from 'aws-lambda';
import { PocketEventType, PocketEventTypeMap } from './events';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import schema from './events/generated/schema.json';
import { MissingFieldsError } from './errors';

// This function is used to parse the event data from the event bridge from a json object to a PocketEvent object
export const parsePocketEvent = <T extends keyof PocketEventTypeMap>(
  json: PocketEventTypeMap[T],
): PocketEventTypeMap[T] => {
  if (!json || !Object.values(PocketEventType).includes(json['detail-type'])) {
    throw new Error(`Unsupported type: ${json['detail-type']}`);
  }

  const ajv = new Ajv();
  addFormats(ajv);
  const validationFn = ajv.compile(schema);
  if (!validationFn(json)) {
    throw new MissingFieldsError(ajv.errorsText(validationFn.errors));
  }

  return json as PocketEventTypeMap[T];
};

export const sqsEventBridgeEvent = <T extends keyof PocketEventTypeMap>(
  record: SQSRecord,
): PocketEventTypeMap[T] | null => {
  const message = JSON.parse(JSON.parse(record.body).Message);
  return parsePocketEvent(message);
};

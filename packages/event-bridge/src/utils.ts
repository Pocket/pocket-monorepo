import { SQSRecord } from 'aws-lambda';
import { PocketEventType, PocketEventTypeMap } from './events';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import schema from './events/generated/schema.json';
import { MissingFieldsError } from './errors';

/**
 * For a given detail type, return the validation schema from our schema.json file
 * This is because AJV can not differeantie between the different schemas and does not know it can select it based on detail-type
 * So instead, we manually pull out the schema we want to use.
 * @param detailType The schema to pull out that matches the detail type
 * @returns A schema to validate against
 */
const validationSchemaForDetailType = (detailType: string) => {
  let validationSchemaName: string | null = null;
  for (const key in schema.definitions) {
    if (
      schema.definitions[key].properties['detail-type']?.const === detailType
    ) {
      validationSchemaName = `#/definitions/${key}`;
    }
  }

  if (validationSchemaName === null) {
    throw new Error(`No type for: ${detailType}`);
  }

  return validationSchemaName;
};

/**
 * Given a JSON object, validate it and turn it into a PocketEvent Type
 * @param json json object to parse
 * @returns PocketEvent Type
 */
const parsePocketEvent = <T extends keyof PocketEventTypeMap>(
  json: PocketEventTypeMap[T],
): PocketEventTypeMap[T] => {
  if (!json || !Object.values(PocketEventType).includes(json['detail-type'])) {
    throw new Error(`Unsupported type: ${json['detail-type']}`);
  }

  // https://ajv.js.org/coercion.html
  // Some data comes from Web repo which.. treats everything as a string or bools as 0/1
  const ajv = new Ajv({ coerceTypes: true });
  addFormats(ajv);

  const schemaName = validationSchemaForDetailType(json['detail-type']);
  ajv.compile(schema);
  const valid = ajv.validate(schemaName, json);

  if (!valid) {
    throw new MissingFieldsError(ajv.errorsText(ajv.errors));
  }

  return json as PocketEventTypeMap[T];
};

/**
 * Given an SQS Record that came from the PocketEventBridge via SNS, parse it into a PocketEvent Type
 * @param record The SQS Record to parse
 * @returns PocketEvent Type
 */
export const sqsEventBridgeEvent = <T extends keyof PocketEventTypeMap>(
  record: SQSRecord,
): PocketEventTypeMap[T] | null => {
  const message = JSON.parse(JSON.parse(record.body).Message);
  return parsePocketEvent(message);
};

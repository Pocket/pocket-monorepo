import { SQSRecord } from 'aws-lambda';
import {
  IncomingBaseEvent,
  PocketEventType,
  PocketEventTypeMap,
} from './events';
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
): PocketEventTypeMap[T] & IncomingBaseEvent => {
  if (!json || !Object.values(PocketEventType).includes(json['detail-type'])) {
    throw new Error(`Unsupported type: ${json['detail-type']}`);
  }

  // https://ajv.js.org/coercion.html
  // Some data comes from Web repo which.. treats everything as a string or bools as 0/1
  const ajv = new Ajv({ coerceTypes: true });
  addFormats(ajv);

  const schemaName = validationSchemaForDetailType(json['detail-type']);
  ajv.compile(schema);
  const valid = ajv.validate<PocketEventTypeMap[T] & IncomingBaseEvent>(
    schemaName,
    json,
  );

  if (!valid) throw new MissingFieldsError(ajv.errorsText(ajv.errors));

  const validBaseEventFields = ajv.validate(
    '#/definitions/IncomingBaseEvent',
    json,
  );
  if (!validBaseEventFields)
    throw new MissingFieldsError(ajv.errorsText(ajv.errors));

  // Hack to convert a known EventBridge field to a Date object.
  // In the future we should probably use JSON JTD to define our schema with discrimantor fields, and then convert it to TypeScript types, which we then use the ajv jtd parser with.
  // However it seems the jtd-codegen package does not know how to handle the $ref field in the schema, so it would end up duplicating fields in the schema, which is not ideal.
  // We really need to do this with DateTime objects, since thats the only thing Typescript can't automatically coerce with `as`.
  // There is a probably a fancy way to do this by traversing the schema and finding all the date fields, but this is a quick and dirty way to do it for the only field that needs it.
  return { ...json, time: new Date(json.time) } as PocketEventTypeMap[T] &
    IncomingBaseEvent;
};

/**
 * Given an SQS Record that came from the PocketEventBridge via SNS, parse it into a PocketEvent Type
 * @param record The SQS Record to parse
 * @returns PocketEvent Type
 */
export const sqsEventBridgeEvent = <T extends keyof PocketEventTypeMap>(
  record: SQSRecord,
): (PocketEventTypeMap[T] & IncomingBaseEvent) | null => {
  const message = JSON.parse(JSON.parse(record.body).Message);
  return parsePocketEvent(message) as PocketEventTypeMap[T] & IncomingBaseEvent;
};
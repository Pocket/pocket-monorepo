import { faker } from '@faker-js/faker';
import { getSchemaFile } from './typeDefs';

/**
 * Define mocks for the schema
 */
export function getMocks() {
  return {
    ID: () => faker.number.int({ min: 1, max: 1000 }),
    Int: () => faker.number.int({ min: 1, max: 1000 }),
    Url: () => faker.internet.url(),
    Timestamp: () => faker.date.recent(),
    String: () => faker.lorem.word(),
    _Service: () => ({ sdl: getSchemaFile() }), // loading the schema for the gateway
  };
}

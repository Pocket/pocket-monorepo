import { Fn } from 'cdktf';
import { Construct } from 'constructs';
import {
  SchemasSchema,
  SchemasSchemaConfig,
} from '@cdktf/provider-aws/lib/schemas-schema';
import { SCHEMA_REGISTRY, SCHEMA_TYPE } from './types';

export class UserEventsSchema extends Construct {
  constructor(
    scope: Construct,
    private name: string,
  ) {
    super(scope, name);
    this.createUserEventsSchema();
  }

  private createUserEventsSchema() {
    const schemaProps: SchemasSchemaConfig = {
      name: 'user-events',
      description: 'events emitted by user-api',
      type: SCHEMA_TYPE,
      registryName: SCHEMA_REGISTRY,
      content: Fn.jsonencode(this.getUserEventsSchema()),
    };
    const schema = new SchemasSchema(this, 'user-events-schema', schemaProps);
    return schema;
  }

  /***
   * schema generated from the aws console and moved here
   * @private
   */
  private getUserEventsSchema() {
    return {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Event',
      },
      paths: {},
      components: {
        schemas: {
          Event: {
            type: 'object',
            required: ['isPremium', 'userId', 'email'],
            properties: {
              email: {
                type: 'string',
              },
              isPremium: {
                type: 'boolean',
              },
              userId: {
                type: 'string',
              },
            },
          },
        },
      },
    };
  }
}

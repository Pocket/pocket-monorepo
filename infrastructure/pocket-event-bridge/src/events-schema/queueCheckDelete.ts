/**
 * Scheduled event to trigger Account Delete Monitor to start
 * the cascade of queued events for checking whether a user's data has
 * been fully removed after they requested to delete their account.
 */
import { Fn } from 'cdktf';
import { Construct } from 'constructs';
import {
  SchemasSchema,
  SchemasSchemaConfig,
} from '@cdktf/provider-aws/lib/schemas-schema';
import { SCHEMA_REGISTRY, SCHEMA_TYPE } from './types';
import { config } from '../event-rules/account-delete-monitor/config';

export class QueueCheckDeleteSchema extends Construct {
  constructor(
    scope: Construct,
    private name: string,
  ) {
    super(scope, name);
    this.createQueueCheckDeleteSchema();
  }

  private createQueueCheckDeleteSchema() {
    const schemaProps: SchemasSchemaConfig = {
      name: config.queueCheckDelete.schema,
      description: `scheduled event to start "check delete" cascade, for determining if a user's data has been removed after deleting their account`,
      type: SCHEMA_TYPE,
      registryName: SCHEMA_REGISTRY,
      content: Fn.jsonencode(this.getScheduleCheckDeleteSchema()),
    };
    const schema = new SchemasSchema(
      this,
      `${config.queueCheckDelete.scheduleExpression}-schema`,
      schemaProps,
    );
    return schema;
  }

  /***
   * Schema scaffold from the aws console
   * @private
   */
  private getScheduleCheckDeleteSchema() {
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
            properties: {
              // Optional for manually generated events,
              // to put a boundary on what requests we check by date
              latestRequestDate: {
                type: 'string',
                format: 'date',
              },
            },
          },
        },
      },
    };
  }
}

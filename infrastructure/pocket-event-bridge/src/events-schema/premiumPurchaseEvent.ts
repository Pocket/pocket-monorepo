/**
 * Creates schema for Premium-Purchase event and Premium-Renewal-Upcoming event
 * Both events share the same payload type
 */
import { Construct } from 'constructs';
import { schemasSchema } from '@cdktf/provider-aws';
import { SCHEMA_REGISTRY, SCHEMA_TYPE } from './types';

export class PremiumPurchaseEvent extends Construct {
  public readonly premiumPurchaseEvent: string = 'Premium-Purchase';
  public readonly premiumRenewalUpcomingEvent: string =
    'Premium-Renewal-Upcoming';

  constructor(
    scope: Construct,
    private name: string,
  ) {
    super(scope, name);
    this.createPremiumPurchaseEvent();
    this.createPremiumRenewalUpcomingEvent();
  }

  private createPremiumPurchaseEvent() {
    const schemaProps: schemasSchema.SchemasSchemaConfig = {
      name: this.premiumPurchaseEvent,
      description: `emitted when pocket user subscribes for premium account`,
      type: SCHEMA_TYPE,
      registryName: SCHEMA_REGISTRY,
      content: JSON.stringify(this.getPremiumPurchaseEventSchema()),
    };
    const schema = new schemasSchema.SchemasSchema(
      this,
      `${this.premiumPurchaseEvent}-Schema`,
      schemaProps,
    );

    return schema;
  }

  private createPremiumRenewalUpcomingEvent() {
    const schemaProps: schemasSchema.SchemasSchemaConfig = {
      name: this.premiumRenewalUpcomingEvent,
      description: `emitted when pocket user premium subscription is renewed`,
      type: SCHEMA_TYPE,
      registryName: SCHEMA_REGISTRY,
      content: JSON.stringify(this.getPremiumPurchaseEventSchema()),
    };
    const schema = new schemasSchema.SchemasSchema(
      this,
      `${this.premiumRenewalUpcomingEvent}-Schema`,
      schemaProps,
    );

    return schema;
  }

  /***
   * Schema scaffold from the aws console
   */
  private getPremiumPurchaseEventSchema() {
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
            required: ['purchase', 'user'],
            properties: {
              purchase: {
                $ref: '#/components/schemas/Purchase',
              },
              user: {
                $ref: '#/components/schemas/User',
              },
            },
          },
          Purchase: {
            type: 'object',
            required: [
              'amount',
              'planType',
              'isFree',
              'planInterval',
              'cancelAtPeriodEnd',
              'isTrial',
              'receiptId',
              'renewDate',
            ],
            properties: {
              amount: {
                type: 'string',
              },
              cancelAtPeriodEnd: {
                type: 'boolean',
              },
              isFree: {
                type: 'boolean',
              },
              isTrial: {
                type: 'boolean',
              },
              planInterval: {
                type: 'string',
              },
              planType: {
                type: 'string',
              },
              receiptId: {
                type: 'string',
              },
              renewDate: {
                type: 'string',
              },
            },
          },
          User: {
            type: 'object',
            required: ['id', 'encodedId', 'email'],
            properties: {
              email: {
                type: 'string',
              },
              encodedId: {
                type: 'string',
              },
              id: {
                type: 'number',
              },
            },
          },
        },
      },
    };
  }
}

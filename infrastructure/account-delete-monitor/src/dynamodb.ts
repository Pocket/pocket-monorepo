import { config } from './config/index.js';

import {
  ApplicationDynamoDBTable,
  ApplicationDynamoDBTableCapacityMode,
} from '@pocket-tools/terraform-modules';
import { Construct } from 'constructs';

export class DynamoDB extends Construct {
  public readonly deleteEventTable: ApplicationDynamoDBTable;

  constructor(
    scope: Construct,
    private name: string,
  ) {
    super(scope, name);
    this.deleteEventTable = this.setupDeleteEventTable();
  }

  /**
   * Sets up the dynamodb table where the delete event records will live
   * @private
   */
  private setupDeleteEventTable() {
    return new ApplicationDynamoDBTable(this, this.name, {
      tags: config.tags,
      prefix: `${config.shortName}-${config.environment}-${this.name}`,
      capacityMode: ApplicationDynamoDBTableCapacityMode.ON_DEMAND,
      preventDestroyTable: true,
      tableConfig: {
        pointInTimeRecovery: {
          enabled: true,
        },
        ttl: {
          enabled: true,
          attributeName: 'expiresAt',
        },
        hashKey: config.dynamodb.deleteEventTable.key,
        attribute: [
          {
            name: config.dynamodb.deleteEventTable.key,
            type: 'S',
          },
        ],
      },
    });
  }
}

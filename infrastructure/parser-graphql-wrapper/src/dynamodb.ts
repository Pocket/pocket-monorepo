import { Construct } from 'constructs';
import { config } from './config/index.js';
import {
  ApplicationDynamoDBTable,
  ApplicationDynamoDBTableCapacityMode,
} from '@pocket-tools/terraform-modules';

export class DynamoDB extends Construct {
  public readonly itemSummaryTable: ApplicationDynamoDBTable;

  constructor(scope: Construct, name: string) {
    super(scope, name);
    this.itemSummaryTable = this.setupItemSummaryTable();
  }

  /**
   * Sets up the dynamodb table where the item summary data will live
   * @private
   */
  private setupItemSummaryTable() {
    // note that this config is mirrored in .docker/localstack/dynamodb/
    // if config changes here, that file should also be updated
    return new ApplicationDynamoDBTable(this, `data`, {
      tags: config.tags,
      prefix: `${config.shortName}-${config.environment}-item-summary`,
      capacityMode: ApplicationDynamoDBTableCapacityMode.ON_DEMAND,
      tableConfig: {
        hashKey: config.dynamodb.itemSummaryTable.key,
        attribute: [
          {
            name: config.dynamodb.itemSummaryTable.key,
            type: 'S',
          },
        ],
      },
      ttl: {
        attributeName: 'ttl',
        enabled: true,
      },
      lifecycle: {
        ignoreChanges: [
          // Bug in terraform with DynamoDB and global secondary indexes
          // https://github.com/hashicorp/terraform-provider-aws/issues/671
          // https://github.com/hashicorp/terraform-provider-aws/issues/671#issuecomment-346711738
          'global_secondary_index',
          'read_capacity',
          'write_capacity',
        ],
      },
    });
  }
}

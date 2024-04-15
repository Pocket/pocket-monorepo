import { Construct } from 'constructs';
import { config } from './config';
import {
  ApplicationDynamoDBTable,
  ApplicationDynamoDBTableCapacityMode,
} from '@pocket-tools/terraform-modules';

export class DynamoDB extends Construct {
  public readonly sharesTable: ApplicationDynamoDBTable;

  constructor(scope: Construct, name: string) {
    super(scope, name);
    this.sharesTable = this.setupSharesTable();
  }

  /**
   * Sets up the dynamodb table where the notes for highlights will live
   * @private
   */
  private setupSharesTable() {
    // note that this config is mirrored in .docker/localstack/dynamodb/
    // if config changes here, that file should also be updated
    return new ApplicationDynamoDBTable(this, `shares`, {
      tags: config.tags,
      prefix: `${config.shortName}-${config.environment}-shares`,
      capacityMode: ApplicationDynamoDBTableCapacityMode.ON_DEMAND,
      tableConfig: {
        hashKey: config.dynamodb.sharesTable.key,
        attribute: [
          {
            name: config.dynamodb.sharesTable.key,
            type: 'S',
          },
        ],
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

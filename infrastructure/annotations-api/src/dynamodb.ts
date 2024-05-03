import { Construct } from 'constructs';
import { config } from './config/index.js';
import {
  ApplicationDynamoDBTable,
  ApplicationDynamoDBTableCapacityMode,
} from '@pocket-tools/terraform-modules';

export class DynamoDB extends Construct {
  public readonly highlightNotesTable: ApplicationDynamoDBTable;

  constructor(scope: Construct, name: string) {
    super(scope, name);
    this.highlightNotesTable = this.setupHighlightNotesTable();
  }

  /**
   * Sets up the dynamodb table where the notes for highlights will live
   * @private
   */
  private setupHighlightNotesTable() {
    // note that this config is mirrored in .docker/localstack/dynamodb/
    // if config changes here, that file should also be updated
    return new ApplicationDynamoDBTable(this, `highlight-notes`, {
      tags: config.tags,
      prefix: `${config.shortName}-${config.environment}-highlight-notes`,
      capacityMode: ApplicationDynamoDBTableCapacityMode.ON_DEMAND,
      tableConfig: {
        hashKey: config.dynamodb.notesTable.key,
        attribute: [
          {
            name: config.dynamodb.notesTable.key,
            type: 'S',
          },
          {
            name: config.dynamodb.notesTable.userId,
            type: 'S',
          },
        ],
        // Should index by userId so that we can purge user data when
        // they delete their account (or potentially after some time since
        // premium status lapsed)
        globalSecondaryIndex: [
          {
            name: 'userId',
            hashKey: 'userId',
            projectionType: 'KEYS_ONLY',
            readCapacity: 5,
            writeCapacity: 5,
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

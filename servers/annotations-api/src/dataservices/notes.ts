import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandOutput,
  BatchGetCommand,
  BatchGetCommandInput,
  BatchGetCommandOutput,
  BatchWriteCommand,
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  UpdateCommand,
  PutCommand,
  PutCommandOutput,
  DeleteCommand,
  DeleteCommandOutput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import config from '../config';
import { HighlightNote, HighlightNoteEntity } from '../types';
import { backoff } from './utils';
import { NotFoundError } from '@pocket-tools/apollo-utils';

export class NotesDataService {
  // Easier to work with Document client since it abstracts the types
  public dynamo: DynamoDBDocumentClient;
  private table = config.dynamoDb.notesTable;

  constructor(
    private client: DynamoDBClient,
    private userId: string,
  ) {
    const dynamoClientConfig: DynamoDBClientConfig = {
      region: config.aws.region,
    };
    // Set endpoint for local client, otherwise provider default
    if (config.aws.endpoint != null) {
      dynamoClientConfig['endpoint'] = config.aws.endpoint;
    }
    this.client = new DynamoDBClient(dynamoClientConfig);
    this.dynamo = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: {
        convertEmptyValues: true,
        removeUndefinedValues: true,
      },
    });
  }

  private toGraphQl(response: HighlightNoteEntity): HighlightNote {
    return {
      highlightId: response[this.table.key],
      text: response[this.table.note],
      _createdAt: response[this.table._createdAt],
      _updatedAt: response[this.table._updatedAt],
    };
  }

  private toEntity(id: string, text: string): HighlightNoteEntity {
    const timeStamp = new Date().getTime() / 1000;
    const noteEntity = {
      [this.table.key]: id,
      [this.table.note]: text,
      [this.table.userId]: this.userId.toString(),
      [this.table._createdAt]: timeStamp,
      [this.table._updatedAt]: timeStamp,
    } as HighlightNoteEntity;
    return noteEntity;
  }

  /**
   * Fetch a note attached to a highlight
   * @param id the highlight's id (annotation_id in the Pocket db)
   * @returns HighlightNote, or null if one does not exist for the highlightId
   */
  public async get(id: string): Promise<HighlightNote | null> {
    const getItemCommand = new GetCommand({
      TableName: this.table.name,
      Key: { [this.table.key]: id },
      ProjectionExpression: [
        this.table.note,
        this.table._createdAt,
        this.table._updatedAt,
        this.table.key,
      ].join(','),
    });
    const response: GetCommandOutput = await this.dynamo.send(getItemCommand);
    if (response?.Item != null) {
      return this.toGraphQl(response.Item as HighlightNoteEntity);
    }
    return null;
  }
  /**
   * Fetch a batch of notes attached to a highlight
   * @param ids array of highlight's ids to fetch (annotation_id in the Pocket db)
   * @returns array of HighlightNote objects
   */
  public async getMany(ids: string[]): Promise<Array<HighlightNote>> {
    const keyList = ids.map((id) => ({ [this.table.key]: id }));
    let unprocessedKeys: BatchGetCommandInput['RequestItems'] = {
      [this.table.name]: {
        Keys: keyList,
      },
    };
    let tries = 0;
    const itemResults: HighlightNoteEntity[] = [];
    // Make requests until entire batch is completed, since size limits
    // may require multiple batch requests
    while (unprocessedKeys) {
      const batchItemCommand = new BatchGetCommand({
        RequestItems: unprocessedKeys,
      });
      // Exponential backoff between requests
      if (tries > 0) {
        await backoff(tries, config.aws.maxBackoff);
      }
      const response: BatchGetCommandOutput = await this.dynamo.send(
        batchItemCommand,
      );
      if (response.Responses) {
        itemResults.push(
          ...(response.Responses?.[this.table.name] as HighlightNoteEntity[]),
        );
      }
      // Increment tries for backoff, and reset unprocessed key list
      tries += 1;
      // Might get an empty object which is truthy in JS...
      if (
        response.UnprocessedKeys &&
        Object.keys(response.UnprocessedKeys).length > 0
      ) {
        unprocessedKeys = response.UnprocessedKeys;
      } else {
        unprocessedKeys = undefined;
      }
    }
    return itemResults.map((item) => this.toGraphQl(item));
  }

  public async create(id: string, text: string): Promise<HighlightNote> {
    const noteEntity = this.toEntity(id, text);
    const putItemCommand = new PutCommand({
      Item: noteEntity,
      TableName: this.table.name,
    });

    const response: PutCommandOutput = await this.dynamo.send(putItemCommand);
    if (response?.$metadata.httpStatusCode === 200) {
      return this.toGraphQl(noteEntity as HighlightNoteEntity);
    }
    throw new Error(
      `Unable to create highlight note (dynamoDB request ID = ${response?.$metadata.requestId}`,
    );
  }

  public async upsert(id: string, text: string): Promise<HighlightNote> {
    const noteEntity = this.toEntity(id, text);
    const updateItemCommand = new UpdateCommand({
      Key: {
        [this.table.key]: id,
      },
      UpdateExpression: `SET ${this.table._updatedAt} = :ua, ${this.table.note} = :tx, ${this.table._createdAt} = if_not_exists(${this.table._createdAt}, :ca)`,
      ExpressionAttributeValues: {
        ':ua': noteEntity.updatedAt,
        ':tx': noteEntity.note,
        ':ca': noteEntity.createdAt,
      },
      ReturnValues: 'ALL_NEW',
      TableName: this.table.name,
    });
    const result = await this.dynamo.send(updateItemCommand);
    const updatedEntity = result.Attributes as Omit<
      HighlightNoteEntity,
      'highlightId'
    >;
    return this.toGraphQl({ highlightId: id, ...updatedEntity });
  }

  /**
   * Retry logic for batch write operations
   * The sdk input is not typed well (so defaulting to any here for ease),
   * but needs to be a valid array of WriteRequest that can be put into
   * BatchWriteCommandInput
   * @param requests
   */
  private async batchWrite(requests) {
    let unprocessedItems: BatchWriteCommandInput['RequestItems'] = {
      [this.table.name]: requests,
    };
    let tries = 0;
    // Make requests until entire batch is completed, since size limits
    // may require multiple batch requests
    while (unprocessedItems) {
      const batchWriteCommand = new BatchWriteCommand({
        RequestItems: unprocessedItems,
      });
      // Exponential backoff between requests
      if (tries > 0) {
        await backoff(tries, config.aws.maxBackoff);
      }
      const response: BatchWriteCommandOutput = await this.dynamo.send(
        batchWriteCommand,
      );
      // Increment tries for backoff, and reset unprocessed writes list
      tries += 1;
      // Might get an empty object which is truthy in JS
      if (
        response.UnprocessedItems &&
        Object.keys(response.UnprocessedItems).length > 0
      ) {
        unprocessedItems = response.UnprocessedItems;
      } else {
        unprocessedItems = undefined;
      }
    }
  }

  /**
   * Create a batch of notes attached to highlights
   * @param notes notes data to insert into db
   * @returns Array of notes corresponding to GraphQL object
   */
  public async batchCreate(
    notes: { id: string; text: string }[],
  ): Promise<HighlightNote[]> {
    const noteEntities = notes.map((note) => this.toEntity(note.id, note.text));
    const notePutRequests = noteEntities.map((note) => {
      return {
        PutRequest: {
          Item: note,
        },
      };
    });
    await this.batchWrite(notePutRequests);
    return noteEntities.map((entity) => this.toGraphQl(entity));
  }

  public async delete(id: string): Promise<string> {
    const deleteItemCommand = new DeleteCommand({
      Key: {
        [this.table.key]: id,
      },
      ReturnValues: 'ALL_OLD',
      TableName: this.table.name,
    });

    const response: DeleteCommandOutput = await this.dynamo.send(
      deleteItemCommand,
    );
    if (response.Attributes == null) {
      throw new NotFoundError('Note does not exist on highlight');
    }
    return id;
  }

  /**
   * Delete all data for a particular user. Used when they delete
   * their account (or perhaps after a certain amount of time after
   * premium cancellation).
   * Depending on a user's behavior, this could be a lot of data to clear;
   * you should not keep the connection to the api client open while this
   * operation is completing, and instead use this as a background process.
   * The calling function should handle any errors thrown by this method.
   */
  public async clearUserData(): Promise<void> {
    // Set this to true to get through one iteration of the while loop
    let lastEvaluatedKey: any = true;
    const queryCommandInput: QueryCommandInput = {
      TableName: this.table.name,
      IndexName: 'userId',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: {
        ':uid': this.userId,
      },
      Limit: 25, // Max value for batch write; non-expandable dynamodb limit
      ProjectionExpression: this.table.key,
    };
    // If LastEvaluatedKey is present in the result set, there are
    // more values to query for
    while (lastEvaluatedKey != null) {
      const highlightResult: QueryCommandOutput = await this.client.send(
        new QueryCommand(queryCommandInput),
      );
      if (highlightResult.Items?.length > 0) {
        const deleteRequests = highlightResult.Items.map((res) => ({
          DeleteRequest: {
            Key: {
              [this.table.key]: res[this.table.key],
            },
          },
        }));
        await this.batchWrite(deleteRequests);
      }
      // Add the start key to the query command in case there are more
      // results to fetch; if null, loop will exit
      lastEvaluatedKey = highlightResult.LastEvaluatedKey;
      queryCommandInput['ExclusiveStartKey'] = lastEvaluatedKey;
    }
  }
}

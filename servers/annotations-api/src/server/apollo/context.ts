import { Knex } from 'knex';
import { HighlightNote } from '../../types.ts';
import DataLoader from 'dataloader';
import {
  AuthenticationError,
  PocketContext,
  PocketContextManager,
} from '@pocket-tools/apollo-utils';
import express from 'express';
import {
  dynamoClient,
  readClient,
  writeClient,
} from '../../database/client.ts';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createNotesLoader } from '../../dataservices/dataloaders.ts';
import { NotesDataService } from '../../dataservices/notes.ts';
import { HighlightsModel } from '../../models/HighlightsModel.ts';
import { ParserAPI } from '../../dataservices/parserApi.ts';
import { HighlightsDataService } from '../../dataservices/highlights.ts';

export interface IContext extends PocketContext {
  userId: string;
  db: {
    readClient: Knex;
    writeClient: Knex;
  };
  dynamoClient: DynamoDBClient;
  parserApi: ParserAPI;
  HighlightsModel: HighlightsModel;
  dataLoaders: {
    noteByHighlightId: DataLoader<string, HighlightNote | null>;
  };
}

export class ContextManager extends PocketContextManager implements IContext {
  public readonly db: IContext['db'];
  public readonly dataLoaders: IContext['dataLoaders'];
  HighlightsModel: HighlightsModel;
  parserApi: ParserAPI;
  dynamoClient: DynamoDBClient;

  constructor(
    private config: {
      request: express.Request;
      db: { readClient: Knex; writeClient: Knex };
      dynamoClient: DynamoDBClient;
    },
  ) {
    super(config.request.headers);
    this.db = config.db;
    this.config = config;
    this.dynamoClient = config.dynamoClient;
    this.parserApi = new ParserAPI();
    const noteService = new NotesDataService(config.dynamoClient, this.userId);
    this.dataLoaders = {
      noteByHighlightId: createNotesLoader(noteService),
    };
    const highlightService = new HighlightsDataService(this);
    this.HighlightsModel = new HighlightsModel(
      highlightService,
      noteService,
      this.parserApi,
      super.userIsPremium,
    );
  }

  get userId(): string {
    const userId = super.userId;

    if (!userId || userId === 'anonymous') {
      throw new AuthenticationError(
        'You must be logged in to use this service',
      );
    }
    return userId as string;
  }

  get apiId(): string {
    const apiId = this.config.request?.headers?.apiid || '0';

    return apiId instanceof Array ? apiId[0] : apiId;
  }
}

/**
 * Context factory function. Creates a new context upon
 * every request
 * @param req server request
 * @returns ContextManager
 */
export async function getContext({
  req,
}: {
  req: express.Request;
}): Promise<ContextManager> {
  return new ContextManager({
    request: req,
    db: {
      readClient: readClient(),
      writeClient: writeClient(),
    },
    dynamoClient: dynamoClient(),
  });
}

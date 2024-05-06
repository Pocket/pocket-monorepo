import { Knex } from 'knex';
import { HighlightNote } from '../../types';
import DataLoader from 'dataloader';
import { AuthenticationError } from '@pocket-tools/apollo-utils';
import express from 'express';
import { dynamoClient, readClient, writeClient } from '../../database/client';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createNotesLoader } from '../../dataservices/dataloaders';
import { NotesDataService } from '../../dataservices/notes';
import { HighlightsModel } from '../../models/HighlightsModel';
import { ParserAPI } from '../../dataservices/parserApi';
import { HighlightsDataService } from '../../dataservices/highlights';

export interface IContext {
  apiId: string;
  userId: string;
  isPremium: boolean;
  db: {
    readClient: Knex;
    writeClient: Knex;
  };
  dynamoClient: DynamoDBClient;
  parserApi: ParserAPI;
  HighlightsModel: HighlightsModel;
  dataLoaders: {
    noteByHighlightId: DataLoader<string, HighlightNote | undefined>;
  };
}

export class ContextManager implements IContext {
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
      this.isPremium,
    );
  }

  get isPremium(): boolean {
    // Using getter to make it easier to stub in tests
    return this.config.request?.headers.premium === 'true';
  }

  get userId(): string {
    const userId = this.config.request.headers.userid;

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

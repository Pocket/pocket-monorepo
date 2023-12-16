import { Knex } from 'knex';
import { HighlightNote } from './types';
import DataLoader from 'dataloader';
import {
  AuthenticationError,
  ForbiddenError,
} from '@pocket-tools/apollo-utils';
import express from 'express';
import { dynamoClient, readClient, writeClient } from './database/client';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createNotesLoader } from './dataservices/dataloaders';
import { NotesDataService } from './dataservices/notes';

export interface IContext {
  apiId: string;
  userId: string;
  isPremium: boolean;
  db: {
    readClient: Knex;
    writeClient: Knex;
  };
  dynamoClient: DynamoDBClient;
  dataLoaders: {
    noteByHighlightId: DataLoader<string, HighlightNote | undefined>;
  };
  notesService: NotesDataService;
}

export class ContextManager implements IContext {
  public readonly db: IContext['db'];
  public readonly dataLoaders: IContext['dataLoaders'];

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
    this.dataLoaders = {
      noteByHighlightId: createNotesLoader(config.dynamoClient, this),
    };
  }
  dynamoClient: DynamoDBClient;
  get isPremium(): boolean {
    // Using getter to make it easier to stub in tests
    return this.config.request?.headers.premium === 'true';
  }

  get userId(): string {
    const userId = this.config.request.headers.userid;

    if (!userId) {
      throw new AuthenticationError(
        'You must be logged in to use this service',
      );
    }

    return userId instanceof Array ? userId[0] : userId;
  }

  get apiId(): string {
    const apiId = this.config.request?.headers?.apiid || '0';

    return apiId instanceof Array ? apiId[0] : apiId;
  }

  get notesService(): NotesDataService {
    if (!this.isPremium) {
      throw new ForbiddenError(
        'Premium account required to access this feature',
      );
    }
    return new NotesDataService(this.dynamoClient, this.userId);
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

import config from '../config';
import request from 'supertest';
import { Server } from 'http';
import { Application } from 'express';
import { startServer } from '../server';

describe(`get digest`, () => {
  let app: Application;
  let server: Server;

  beforeAll(async () => {
    ({ app, server } = await startServer(0));
  });
  afterAll(async () => {
    server.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 500 if invalid api key is provided ', async () => {
    const response = await request(app).get(
      `/digest/someuseridhere?apikey=invalid-api-key`,
    );
    expect(response.statusCode).toBe(500);
    expect(response.body.error).not.toBeUndefined();
    expect(response.body.error).toBe(config.app.INVALID_API_KEY_ERROR_MESSAGE);
  });
});

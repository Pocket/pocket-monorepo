import request from 'supertest';
import { startServer } from '../server';
import { Server } from 'http';
import { Application } from 'express';

describe('v3Get', () => {
  let app: Application;
  let server: Server;
  beforeAll(async () => {
    ({ app, server } = await startServer(0));
  });
  afterAll(async () => {
    server.close();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('v3/send', () => {
    it('Returns 400 if action array element name is not in allowlist', async () => {
      const response = await request(app)
        .post('/v3/send')
        .send({
          consumer_key: 'test',
          access_token: 'test',
          actions: [{ action: 'really_add', url: 'http://domain.com/path' }],
        });
      expect(response.status).toEqual(400);
    });
    it('Returns 400 if action array element fails validation', async () => {
      const response = await request(app)
        .post('/v3/send')
        .send({
          consumer_key: 'test',
          access_token: 'test',
          actions: [
            { action: 'add', url: 'http://domain.com/path' },
            { action: 'add', url: 'not a url' },
          ],
        });
      expect(response.status).toEqual(400);
    });
  });
});

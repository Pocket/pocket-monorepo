import request from 'supertest';
import { startServer } from './server';
import { Server } from 'http';
import { Application } from 'express';

describe('main.integration.ts', () => {
  let app: Application;
  let server: Server;

  beforeAll(async () => {
    ({ app, server } = await startServer(0));
  });
  afterAll(async () => {
    server.close();
  });

  describe('health endpoint', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/.well-known/server-health');

      expect(response.statusCode).toBe(200);
      expect(response.text).not.toBeNull();
      expect(response.text).toBe('ok');
    });
  });
});

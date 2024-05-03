import { Application } from 'express';
import request from 'supertest';
import { startServer } from './server.js';
import { Server } from 'http';

describe('server is up!', () => {
  let app: Application;
  let server: Server;

  beforeAll(async () => {
    ({ app, server } = await startServer(0));
  });
  afterAll(async () => {
    server.close();
  });
  it('health check', async () => {
    const response = await request(app).get('/.well-known/server-health');
    expect(response.status).toBe(200);
    expect(response.text).toBe('ok');
  });
});

import request from 'supertest';
import { app, server } from './main';

describe('server is up!', () => {
  afterAll(async () => {
    server.close();
  });
  it('health check', async () => {
    const response = await request(app).get('/.well-known/server-health');
    expect(response.status).toBe(200);
    expect(response.text).toBe('ok');
  });
});

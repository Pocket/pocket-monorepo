import request from 'supertest';
import { app } from './main';
import { expect } from 'chai';

describe('main.integration.ts', () => {
  const requestAgent = request.agent(app);

  describe('health endpoint', () => {
    it('should return 200 OK', async () => {
      const response = await requestAgent.get('/.well-known/server-health');

      expect(response.statusCode).equals(200);
      expect(response.text).is.not.null;
      expect(response.text).equals('ok');
    });
  });
});

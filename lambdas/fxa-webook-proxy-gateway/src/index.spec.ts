import { expect } from 'chai';
import sinon from 'sinon';
import {
  createSuccessResponseMessage,
  formatResponse,
  generateEvents,
} from './index';
import { EVENT, SqsEvent } from './types';

describe('Handler functions', () => {
  describe('Format of API Gateway response', () => {
    it('should format a successful response in a standard way', () => {
      const statusCode = 200;
      const actual = formatResponse(statusCode, 'Hello');
      expect(actual).to.deep.equal({
        statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statusCode, message: 'Hello' }),
      });
    });

    it('should format an unsuccessful response in a standard way', () => {
      const statusCode = 400;
      const actual = formatResponse(statusCode, 'Bad request', true);
      expect(actual).to.deep.equal({
        statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statusCode, error: 'Bad request' }),
      });
    });
  });

  describe('Generating SQS events data', () => {
    let clock;
    const now = Date.now();

    beforeAll(() => {
      clock = sinon.useFakeTimers({
        now: now,
        shouldAdvanceTime: true,
      });
    });

    afterAll(() => clock.restore());

    it('should generate SQS event data for FxA apple migration event', () => {
      const testEventPayload = {
        fxaEmail: 'test_user@mozilla.com',
        appleEmail: 'test_user@private.apple.com',
        uid: 'FXA_USER_ID',
        transferSub: 'random_guid',
        changeTime: 1565721242227,
        success: 'true',
      };
      const data = {
        sub: 'FXA_USER_ID',
        events: {
          'https://schemas.accounts.firefox.com/event/apple-user-migration': {
            ...testEventPayload,
          },
        },
      };

      const actual: SqsEvent[] = generateEvents(data);
      expect(actual[0]).to.deep.equal({
        user_id: testEventPayload.uid,
        event: EVENT.APPLE_MIGRATION,
        timestamp: Math.round(now / 1000),
        user_email: testEventPayload.fxaEmail,
        transfer_sub: testEventPayload.transferSub,
      });
    });

    it('should generate SQS event data for FxA profile change event', () => {
      const data = {
        sub: 'FXA_USER_ID',
        events: {
          'https://schemas.accounts.firefox.com/event/profile-change': {},
        },
      };

      const actual: SqsEvent[] = generateEvents(data);
      expect(actual[0]).to.deep.equal({
        user_id: 'FXA_USER_ID',
        event: EVENT.PROFILE_UPDATE,
        timestamp: Math.round(now / 1000),
        user_email: undefined,
        transfer_sub: null,
      });
    });

    it('should generate SQS event data for FxA user delete event', () => {
      const data = {
        sub: 'FXA_USER_ID',
        events: {
          'https://schemas.accounts.firefox.com/event/delete-user': {},
        },
      };

      const actual: SqsEvent[] = generateEvents(data);
      expect(actual[0]).to.deep.equal({
        user_id: 'FXA_USER_ID',
        event: EVENT.USER_DELETE,
        timestamp: Math.round(now / 1000),
        user_email: undefined,
        transfer_sub: null,
      });
    });

    it('should generate SQS event data for multiple FxA events', () => {
      const data = {
        sub: 'FXA_USER_ID',
        events: {
          'https://schemas.accounts.firefox.com/event/delete-user': {},
          'https://schemas.accounts.firefox.com/event/profile-change': {},
        },
      };

      const actual: SqsEvent[] = generateEvents(data);
      const timestamp = Math.round(now / 1000);
      expect(actual).to.deep.equal([
        {
          user_id: 'FXA_USER_ID',
          event: EVENT.USER_DELETE,
          timestamp,
          user_email: undefined,
          transfer_sub: null,
        },
        {
          user_id: 'FXA_USER_ID',
          event: EVENT.PROFILE_UPDATE,
          timestamp,
          user_email: undefined,
          transfer_sub: null,
        },
      ]);
    });

    it('should generate SQS event data for FxA profile change event for user email update', () => {
      const data = {
        sub: 'FXA_USER_ID',
        events: {
          'https://schemas.accounts.firefox.com/event/profile-change': {
            email: 'example@test.com',
          },
        },
      };

      const actual: SqsEvent[] = generateEvents(data);

      const fxAEvent: string = Object.keys(data.events)[0];

      expect(actual[0]).to.deep.equal({
        user_id: 'FXA_USER_ID',
        event: EVENT.PROFILE_UPDATE,
        timestamp: Math.round(now / 1000),
        user_email: data.events[fxAEvent].email,
        transfer_sub: null,
      });
    });
  });

  describe('Successful response message', () => {
    it('should create a successful response message', () => {
      const actual = createSuccessResponseMessage(1, 0);
      expect(actual).to.equal(`Successfully sent 1 out of 1 events to SQS.`);
    });

    it('should create a successful response message with failed event info', () => {
      const actual = createSuccessResponseMessage(2, 1);
      expect(actual).to.equal(
        `Successfully sent 1 out of 2 events to SQS. Review cloudwatch and sentry logs for information about failed events.`
      );
    });
  });
});

import { FxaJwt } from './jwt';
import { expect } from 'chai';
import sinon from 'sinon';
import * as Sentry from '@sentry/serverless';
import { eventHandler, formatResponse } from './index';
import config from './config';
import {
  PurgeQueueCommand,
  ReceiveMessageCommand,
  ReceiveMessageCommandInput,
} from '@aws-sdk/client-sqs';
import { sqsClient } from './sqs';
import { APIGatewayEvent } from 'aws-lambda';
import { EVENT } from './types';

const sampleApiGatewayEvent: APIGatewayEvent = {
  body: null,
  multiValueHeaders: { test: undefined },
  httpMethod: 'POST',
  isBase64Encoded: false,
  path: 'events',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  resource: '',
  headers: {},
  requestContext: {
    accountId: '123456789012',
    apiId: 'id',
    authorizer: {
      claims: null,
      scopes: null,
    },
    extendedRequestId: 'request-id',
    httpMethod: 'POST',
    identity: {
      apiKey: null,
      apiKeyId: null,
      accessKey: null,
      accountId: null,
      caller: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: 'IP',
      user: null,
      userAgent: 'user-agent',
      userArn: null,
      clientCert: {
        clientCertPem: 'CERT_CONTENT',
        subjectDN: 'www.example.com',
        issuerDN: 'Example issuer',
        serialNumber: 'a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1',
        validity: {
          notBefore: 'May 28 12:30:02 2019 GMT',
          notAfter: 'Aug 5 09:36:04 2021 GMT',
        },
      },
    },
    protocol: 'https',
    stage: 'test',
    path: 'events',
    requestId: 'request-id',
    requestTimeEpoch: 123456,
    resourceId: 'resource-id',
    resourcePath: 'resource-path',
  },
};

async function getSqsMessages(): Promise<any[]> {
  const receiveParams: ReceiveMessageCommandInput = {
    QueueUrl: config.aws.sqs.fxaEventsQueue.url,
    MaxNumberOfMessages: 10,
    VisibilityTimeout: 20,
    WaitTimeSeconds: 4,
  };
  const receiveCommand = new ReceiveMessageCommand(receiveParams);
  const response: any = await sqsClient.send(receiveCommand);
  return response.Messages;
}

describe('API Gateway successful event handler', () => {
  let clock;
  const now = Date.now();
  let sqsSpy: any;
  let consoleSpy: any;
  let sentrySpy: any;

  beforeAll(() => {
    clock = sinon.useFakeTimers({
      now: now,
      shouldAdvanceTime: false,
    });
  });

  beforeEach(async () => {
    await sqsClient.send(
      new PurgeQueueCommand({ QueueUrl: config.aws.sqs.fxaEventsQueue.url })
    );

    // Set up spies 👀
    sqsSpy = jest.spyOn(sqsClient, 'send');
    consoleSpy = jest.spyOn(console, 'log');
    sentrySpy = jest.spyOn(Sentry, 'captureException');
  });

  afterAll(async () => {
    clock.restore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Gateway bad events', () => {
    it('should return an error if the authorization header is missing', async () => {
      const actual = await eventHandler(sampleApiGatewayEvent);

      expect(actual).to.deep.equal(
        formatResponse(400, 'Missing authorization header', true)
      );
    });

    it('should return an error if the auth type is not Bearer', async () => {
      const actual = await eventHandler({
        ...sampleApiGatewayEvent,
        headers: { authorization: 'Noop noway' },
      });

      expect(actual).to.deep.equal(
        formatResponse(401, 'Invalid auth type', true)
      );
    });

    it('should return an error if the authorization token is wrong', async () => {
      const actual = await eventHandler({
        ...sampleApiGatewayEvent,
        headers: { authorization: 'Bearer noway' },
      });

      expect(actual).to.deep.equal(
        formatResponse(401, 'Token could not be decoded.', true)
      );
    });
  });

  describe('API Gateway good events', () => {
    let jwtSpy;
    beforeEach(() => {
      jwtSpy = sinon.stub(FxaJwt.prototype, 'validate');
    });
    afterEach(() => {
      jwtSpy.restore();
    });
    const validEvent = {
      ...sampleApiGatewayEvent,
      headers: {
        authorization:
          'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJGWEFfVVNFUl9JRCIsImV2ZW50cyI6eyJodHRwczovL3NjaGVtYXMuYWN' +
          'jb3VudHMuZmlyZWZveC5jb20vZXZlbnQvcHJvZmlsZS1jaGFuZ2UiOnt9LCJodHRwczovL3NjaGVtYXMuYWNjb3VudHMuZmlyZWZveC5jb20vZX' +
          'ZlbnQvZGVsZXRlLXVzZXIiOnt9fSwiaWF0IjoxNjQxNTEwOTA5fQ.n2gqY-u4Sa0zSDGRBtFF7glZQMeW5BeMEDtXPsv_RykdfMqJxF8kn3q9Cm' +
          '395yXHipskhtZjwiGrjHSlSJaN8fbpHZ_AjWbF66BOYtbRtZy_xiZOOR0ZrZowIgyHpzs1--XZCJWm7GU9q5WSjuIe8Gu_NwfqtZBBMod7ULbt8' +
          'OtQpy2QEgC0hawICpozSkgIkHki1JVZgDoRuu9Jb0RDsz2C-9pBskpRmxb7wwb4l_PCZ5eAJ70u8b-25P6tEQTZHnJimuJ7pfvZSoAV3UMdIugi' +
          'vIMysYrgH56QPxi-qxrcaOXQtws3mW2lefe-jH1vp1cSX_wR8WsORRZSwe5HRhPplK01OXQtV_c1Sut3lZf7uNhi13jXUzGnrj4G59fF7F-rce3' +
          'MeA1mfOlduwiVsinLXDCatiwGU6C9SrZ_qUSlq8t6ctPkPKrpAcK4RcLmxjQ6YARyA4IYkk_KLbLFhn0OkuRWKskaFFRpKV94LUIkBR3B9Tj5Zt' +
          'D5lUikhpUZkCTG3u7Vl5fLAolaYYFh6iNRS1br279BC7YQwDZhZyQPNWxCYxNYIRtbtbTfMDpZW2kntv9tGItGb7NTRa_uiwTqZ02-_Rzyd-yxw' +
          'w3HvxB8ORTvXWnGeTJprW5GnpikjSxHVHzMGheuJa0p0UyAQCfsQq9snGJTjA5-EZV1Sn4',
      },
    };

    it('should send valid messages to SQS', async () => {
      jwtSpy.resolves({
        sub: 'FXA_USER_ID',
        events: {
          'https://schemas.accounts.firefox.com/event/profile-change': {},
          'https://schemas.accounts.firefox.com/event/delete-user': {},
        },
      });

      const handlerResponse = await eventHandler(validEvent);

      const messages = await getSqsMessages();

      // Check both events exist in the queue
      [EVENT.PROFILE_UPDATE, EVENT.USER_DELETE].forEach((event, index) => {
        expect(JSON.parse(messages[index].Body)).to.deep.equal({
          user_id: 'FXA_USER_ID',
          event,
          timestamp: Math.round(now / 1000),
          transfer_sub: null,
        });
      });

      expect(handlerResponse).to.deep.equal(
        formatResponse(200, 'Successfully sent 2 out of 2 events to SQS.')
      );
    });

    it('should send valid messages to SQS for email change profile updated event', async () => {
      jwtSpy.resolves({
        sub: 'FXA_USER_ID',
        events: {
          'https://schemas.accounts.firefox.com/event/profile-change': {
            email: 'example@test.com',
          },
        },
      });

      const handlerResponse = await eventHandler(validEvent);

      const messages = await getSqsMessages();

      expect(JSON.parse(messages[0].Body)).to.deep.equal({
        user_id: 'FXA_USER_ID',
        event: EVENT.PROFILE_UPDATE,
        timestamp: Math.round(now / 1000),
        user_email: 'example@test.com',
        transfer_sub: null,
      });

      expect(handlerResponse).to.deep.equal(
        formatResponse(200, 'Successfully sent 1 out of 1 events to SQS.')
      );
    });

    it('should not send messages to SQS if no valid FxA events are found', async () => {
      jwtSpy.resolves({
        sub: 'FXA_USER_ID',
        events: {
          'https://schemas.accounts.firefox.com/event/subscription-state-change':
            {},
        },
      });

      const handlerResponse = await eventHandler(validEvent);

      const messages = await getSqsMessages();

      expect(messages).to.be.undefined;
      expect(handlerResponse).to.deep.equal(
        formatResponse(200, 'No valid events')
      );
    });

    it('should send partial events and log failed SQS send to cloudwatch and sentry', async () => {
      jwtSpy.resolves({
        sub: 'FXA_USER_ID',
        events: {
          'https://schemas.accounts.firefox.com/event/profile-change': {},
          'https://schemas.accounts.firefox.com/event/delete-user': {},
        },
      });

      sqsSpy.mockReturnValueOnce(Promise.reject(new Error('no send')));

      const handlerResponse = await eventHandler(validEvent);

      const messages = await getSqsMessages();

      expect(JSON.parse(messages[0].Body)).to.deep.equal({
        user_id: 'FXA_USER_ID',
        event: EVENT.USER_DELETE,
        timestamp: Math.round(now / 1000),
        transfer_sub: null,
      });
      expect(consoleSpy.mock.calls[0][0]).to.contain('error: no send');
      expect(sentrySpy.mock.calls[0][0].message).to.equal('no send');
      expect(JSON.parse(handlerResponse.body).message).to.contain(
        'Successfully sent 1 out of 2 events to SQS'
      );
    });
  });
});

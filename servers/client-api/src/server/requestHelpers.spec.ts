import {
  addRecordToRequestHeader,
  buildRequestHeadersFromPocketUser,
  buildRequestHeadersFromWebRequest,
  extractHeader,
} from './requestHelpers';
import { Headers } from 'node-fetch';
import { GatewayGraphQLRequest } from '@apollo/server-gateway-interface';
import { PocketUser } from '../jwtUtils';
import { IContext } from './context';

describe('test adding values from PocketUser to request headers', () => {
  let request: GatewayGraphQLRequest;
  const pocketUserTemplate: PocketUser = {
    apiId: 'api.key.xyz',
    applicationIsNative: false,
    applicationIsTrusted: true,
    applicationName: 'app.name',
    consumerKey: 'consumer.key',
    email: 'user@gmail.com',
    encodedGuid: 'encoded.guid',
    fxaUserId: 'fxa.user.id',
    guid: '666',
    premium: true,
    roles: ['role1', 'role2'],
    userId: '123',
  };

  beforeEach(() => {
    request = {
      http: {
        url: 'testing.is.ok',
        method: 'POST',
        headers: new Headers(),
      },
    };
  });

  it('copies all the pocket user properties and values to headers when valid', () => {
    const pocketUser: PocketUser = pocketUserTemplate;

    const subgraphRequest = buildRequestHeadersFromPocketUser(
      request,
      pocketUser
    );

    const headers = subgraphRequest.http.headers;
    expect(headers.get('apiId')).toBe('api.key.xyz');
    expect(headers.get('applicationIsNative')).toBe('false');
    expect(headers.get('applicationIsTrusted')).toBe('true');
    expect(headers.get('applicationName')).toBe('app.name');
    expect(headers.get('consumerKey')).toBe('consumer.key');
    expect(headers.get('email')).toBe('user@gmail.com');
    expect(headers.get('encodedGuid')).toBe('encoded.guid');
    expect(headers.get('fxaUserId')).toBe('fxa.user.id');
    expect(headers.get('guid')).toBe('666');
    expect(headers.get('premium')).toBe('true');
    expect(headers.get('roles')).toBe('role1,role2');
    expect(headers.get('userId')).toBe('123');
  });
  it('does not copy non-existent keys from PocketUser', () => {
    const pocketUser: PocketUser = {};
    const subgraphRequest = buildRequestHeadersFromPocketUser(
      request,
      pocketUser
    );
    for (const key of Object.keys(pocketUser)) {
      expect(subgraphRequest.http.headers.has(key)).toBe(false);
    }
  });
  it('does not copy null values from PocketUser', () => {
    const pocketUser: PocketUser = pocketUserTemplate;
    for (const key of Object.keys(pocketUserTemplate)) {
      pocketUser[key] = null;
    }
    const subgraphRequest = buildRequestHeadersFromPocketUser(
      request,
      pocketUser
    );
    console.log(subgraphRequest.http.headers);
    for (const key of Object.keys(pocketUserTemplate)) {
      expect(subgraphRequest.http.headers.has(key)).toBe(false);
    }
  });
  it('does not copy undefined values from PocketUser', () => {
    const pocketUser: PocketUser = pocketUserTemplate;
    for (const key of Object.keys(pocketUserTemplate)) {
      pocketUser[key] = undefined;
    }
    const subgraphRequest = buildRequestHeadersFromPocketUser(
      request,
      pocketUser
    );
    for (const key of Object.keys(pocketUserTemplate)) {
      expect(subgraphRequest.http.headers.has(key)).toBe(false);
    }
  });
  it('does not copy empty string values from PocketUser', () => {
    const pocketUser: PocketUser = pocketUserTemplate;
    const stringProperties = [
      'apiId',
      'applicationName',
      'consumerKey',
      'email',
      'encodedGuid',
      'encodedId',
      'fxaUserId',
      'guid',
      'userId',
    ];
    for (const key of stringProperties) {
      pocketUser[key] = '';
    }
    const subgraphRequest = buildRequestHeadersFromPocketUser(
      request,
      pocketUser
    );
    console.log(subgraphRequest.http.headers);
    for (const key of Object.keys(pocketUserTemplate)) {
      expect(key in subgraphRequest.http.headers).toBe(false);
    }
  });
  it('ignores expected numeric string values that are not numeric', () => {
    const expectedNumericStringProperties = ['guid', 'userId'];
    const pocketUser: PocketUser = {
      guid: 'not a number',
      userId: 'not a number',
    };
    const subgraphRequest = buildRequestHeadersFromPocketUser(
      request,
      pocketUser
    );
    for (const key of expectedNumericStringProperties) {
      expect(key in subgraphRequest.http.headers).toBe(false);
    }
  });
  it('coerces roles to a string as expected', () => {
    const pocketUser: PocketUser = {
      roles: ['role1', 'role2'],
    };
    const subgraphRequest = buildRequestHeadersFromPocketUser(
      request,
      pocketUser
    );
    expect(subgraphRequest.http.headers.get('roles')).toBe('role1,role2');
  });
});

describe('request helpers', () => {
  let request: GatewayGraphQLRequest;

  beforeEach(() => {
    request = {
      http: {
        url: 'testing.is.ok',
        method: 'POST',
        headers: new Headers(),
      },
    };
  });
  it('adds web repo specific headers to a request', () => {
    const webRequest: IContext['webRequest'] = {
      userAgent: 'Test;This;Not;That',
      ipAddress: '1.2.3.4',
      language: 'en',
      snowplowDomainUserId: 'sn1ow',
    };

    const subgraphRequest = buildRequestHeadersFromWebRequest(
      request,
      webRequest
    );

    const headers = subgraphRequest.http.headers;
    expect(headers.get('gatewayUserAgent')).toEqual('Test;This;Not;That');
    expect(headers.get('gatewayIpAddress')).toEqual('1.2.3.4');
    expect(headers.get('gatewaySnowplowDomainUserId')).toEqual('sn1ow');
    expect(headers.get('gatewayLanguage')).toEqual('en');
  });
  it('copies arbitrary key-value strings to request headers', () => {
    const arbitraryObject = {
      ice: 'cannon',
      tShirt: 'cube',
      'x-forwarded-for': 'myip',
    };
    addRecordToRequestHeader(arbitraryObject, request);
    expect(request.http.headers.get('ice')).toEqual('cannon');
    expect(request.http.headers.get('tShirt')).toEqual('cube');
    expect(request.http.headers.get('x-forwarded-for')).toEqual('myip');
  });
  it('extracts first value from string array, or returns the string', () => {
    const someFakeHeaders = {
      yeet: 'yoink',
      words: ['yeet', 'yoink'],
    };
    expect(extractHeader(someFakeHeaders.yeet)).toEqual('yoink');
    expect(extractHeader(someFakeHeaders.words)).toEqual('yeet');
  });

  it('removes undefined headers and doesnt add them', () => {
    const arbitraryObject = {
      ice: undefined,
    };
    addRecordToRequestHeader(arbitraryObject, request);

    expect(request.http.headers.has('ice')).toEqual(false);
  });
});

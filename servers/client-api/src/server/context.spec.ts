import { getAppContext } from './context';
import { expect } from 'chai';
import { addRecordToRequestHeader } from './requestHelpers';
import { GatewayGraphQLRequest } from '@apollo/server-gateway-interface';
import { Headers } from 'node-fetch';

describe('context', () => {
  it('creates the app context using appropriate web repo headers from an apollo request context', async () => {
    const requestContext = {
      req: {
        headers: {
          'web-request-user-agent': 'Could;Be;Real',
          'web-request-ip-address': '1.2.3.4',
        },
      },
    };

    const context = await getAppContext(requestContext, {
      kid: 'fakepublickey',
    } as Record<string, string>);

    expect(context.webRequest).to.deep.include({
      userAgent: 'Could;Be;Real',
      ipAddress: '1.2.3.4',
    });
  });

  it('returns undefined for a webRequest properties when required headers are not found in apollo request context', async () => {
    const requestContext = {
      req: {
        headers: {
          'web-request-not-valid': 'nope',
          'no-way-this-is-used': 'facts',
        },
      },
    };

    const context = await getAppContext(requestContext, {
      kid: 'fakepublickey',
    } as Record<string, string>);

    expect(context.webRequest).to.deep.include({
      userAgent: undefined,
      ipAddress: undefined,
      snowplowDomainUserId: undefined,
      language: undefined,
    });
  });

  it('returns no transfer sub if it does not exist', async () => {
    const requestContext = {
      req: {
        headers: {
          'web-request-not-valid': 'nope',
          'no-way-this-is-used': 'facts',
        },
      },
    };

    const context = await getAppContext(requestContext, {
      kid: 'fakepublickey',
    } as Record<string, string>);

    const request: GatewayGraphQLRequest = {
      http: {
        url: 'testing.is.ok',
        method: 'POST',
        headers: new Headers(),
      },
    };
    addRecordToRequestHeader(context.forwardHeaders, request);
    expect(request.http.headers.has('transfersub')).to.be.false;
  });

  it('returns transfer sub if it does exist', async () => {
    const requestContext = {
      req: {
        headers: {
          'web-request-not-valid': 'nope',
          'no-way-this-is-used': 'facts',
          transfersub: 'thesub',
        },
      },
    };
    const context = await getAppContext(requestContext, {
      kid: 'fakepublickey',
    } as Record<string, string>);

    const request: GatewayGraphQLRequest = {
      http: {
        url: 'testing.is.ok',
        method: 'POST',
        headers: new Headers(),
      },
    };
    addRecordToRequestHeader(context.forwardHeaders, request);
    expect(request.http.headers.has('transfersub')).to.be.true;
    expect(request.http.headers.get('transfersub')).to.be.equal('thesub');
  });
});

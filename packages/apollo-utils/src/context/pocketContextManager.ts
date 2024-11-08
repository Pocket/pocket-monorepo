import { IncomingHttpHeaders } from 'http';

export interface PocketContext {
  headers: IncomingHttpHeaders;
  userId: string | undefined;
  encodedUserId: string | undefined;
  apiId: string;
  ip: string | undefined;
  encodedGuid: string | undefined;
  guid: string | undefined;
  email: string | undefined;
  applicationName: string | undefined;
  applicationIsNative: boolean;
  applicationIsTrusted: boolean;
  clientVersion: string | undefined;
  userIsPremium: boolean;
  gatewayLanguage: string | undefined;
  gatewaySnowplowDomainUserId: string | undefined;
  gatewaySnowplowDomainSessionId: string | undefined;
  gatewayIpAddress: string | undefined;
  gatewayUserAgent: string | undefined;
}

/**
 * Base class for all the headers that we can extract from our Pocket Request Context from our Apollo router
 */
export class PocketContextManager implements PocketContext {
  public constructor(public readonly headers: IncomingHttpHeaders) {}

  get userIsPremium(): boolean {
    return this.stringHeader('premium') === 'true';
  }

  get encodedUserId(): string | undefined {
    return this.stringHeader('encodedid');
  }

  get guid(): string | undefined {
    return this.stringHeader('guid');
  }

  get encodedGuid(): string | undefined {
    return this.stringHeader('encodedguid');
  }

  get userId(): string | undefined {
    return this.stringHeader('userid');
  }

  get email(): string | undefined {
    return this.stringHeader('email');
  }

  get apiId(): string {
    return this.stringHeader('apiid') || '0';
  }

  get ip(): string | undefined {
    return (
      this.stringHeader('applicationname') ||
      this.stringHeader('origin-client-ip')
    );
  }

  get applicationName(): string | undefined {
    return this.stringHeader('applicationname');
  }

  get applicationIsNative(): boolean {
    return this.stringHeader('applicationisnative') === 'true';
  }

  get applicationIsTrusted(): boolean {
    return this.stringHeader('applicationistrusted') === 'true';
  }

  get clientVersion(): string | undefined {
    return this.stringHeader('clientversion');
  }

  get gatewayLanguage(): string | undefined {
    return this.stringHeader('gatewaylanguage');
  }

  get gatewaySnowplowDomainUserId(): string | undefined {
    return this.stringHeader('gatewaysnowplowdomainuserid');
  }

  get gatewaySnowplowDomainSessionId(): string | undefined {
    return this.stringHeader('gatewaysnowplowdomainsessionid');
  }

  get gatewayIpAddress(): string | undefined {
    return this.stringHeader('gatewayipaddress');
  }

  get gatewayUserAgent(): string | undefined {
    return this.stringHeader('gatewayuseragent');
  }

  private stringHeader(header: string): string | undefined {
    const value = this.headers[header];
    return value instanceof Array ? value[0] : value;
  }
}

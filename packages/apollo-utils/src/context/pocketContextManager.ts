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
  gatewayUserAgent: string | undefined;
}

/**
 * Base class for all the headers that we can extract from our Pocket Request Context from our Apollo router
 */
export class PocketContextManager implements PocketContext {
  public constructor(public readonly headers: IncomingHttpHeaders) {}

  /**
   * Whether the user is premium
   */
  get userIsPremium(): boolean {
    return this.stringHeader('premium') === 'true';
  }

  /**
   * The encoded user ID of the end user
   */
  get encodedUserId(): string | undefined {
    return this.stringHeader('encodedid');
  }

  /**
   * The numeric GUID of the end user
   */
  get guid(): string | undefined {
    return this.stringHeader('guid');
  }

  /**
   * The encoded GUID of the end user
   */
  get encodedGuid(): string | undefined {
    return this.stringHeader('encodedguid');
  }

  /**
   * The numeric user ID of the end user
   */
  get userId(): string | undefined {
    return this.stringHeader('userid');
  }

  /**
   * The email of the end user
   */
  get email(): string | undefined {
    return this.stringHeader('email');
  }

  /**
   * The API ID of the end user
   */
  get apiId(): string {
    return this.stringHeader('apiid') || '0';
  }

  /**
   * The IP address of the end user
   */
  get ip(): string | undefined {
    return (
      this.stringHeader('gatewayipaddress') ||
      this.stringHeader('origin-client-ip')
    );
  }

  /**
   * The application name the end user is using
   */
  get applicationName(): string | undefined {
    return this.stringHeader('applicationname');
  }

  /**
   * Whether the application is native
   */
  get applicationIsNative(): boolean {
    return this.stringHeader('applicationisnative') === 'true';
  }

  /**
   * Whether the application is trusted
   */
  get applicationIsTrusted(): boolean {
    return this.stringHeader('applicationistrusted') === 'true';
  }

  /**
   * The client version of the end user
   */
  get clientVersion(): string | undefined {
    return this.stringHeader('clientversion');
  }

  /**
   * The language of the end user
   */
  get gatewayLanguage(): string | undefined {
    return this.stringHeader('gatewaylanguage');
  }

  /**
   * The Snowplow domain user ID
   */
  get gatewaySnowplowDomainUserId(): string | undefined {
    return this.stringHeader('gatewaysnowplowdomainuserid');
  }

  /**
   * The Snowplow domain session ID
   */
  get gatewaySnowplowDomainSessionId(): string | undefined {
    return this.stringHeader('gatewaysnowplowdomainsessionid');
  }

  /**
   * The user agent of the end user
   */
  get gatewayUserAgent(): string | undefined {
    return this.stringHeader('gatewayuseragent');
  }

  /**
   * Helper function to extract a string header from the headers object
   * @param header
   * @returns string | undefined
   */
  private stringHeader(header: string): string | undefined {
    const value = this.headers[header];
    return value instanceof Array ? value[0] : value;
  }
}

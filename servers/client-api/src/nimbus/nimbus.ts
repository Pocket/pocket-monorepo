import { URL } from 'url';
import fetch, { RequestInit, Response } from 'node-fetch';

/**
 * Interface to Nimbus server. Does (or will) know how to:
 *
 * - Test if Nimbus is alive
 * - Query Nimbus for a client's experiment inclusion
 *
 */
export class NimbusServer {
  public static readonly DEFAULT_PROTOCOL = 'http:';
  public static connectionTimeout = 500;
  private static readonly hasProtocol = new RegExp('^[a-z]{3,6}://');
  private static readonly pingPath = '/ok';

  private nimbusUrl: URL;

  /**
   * Nimbus constructor. This is the main local interface to Nimbus.
   *
   * @param host The nimbus host. If this doesn't start with a protocol, http is assumed.
   *
   * @throws TypeError if the host pattern is invalid or doesn't specify a port.
   */
  constructor(host: string) {
    if (!NimbusServer.hasProtocol.test(host)) {
      host = NimbusServer.DEFAULT_PROTOCOL + host;
    }
    try {
      this.nimbusUrl = new URL(host);
    } catch (e) {
      console.error(`Error: ${e.message} - ${host}`);
      throw e;
    }
    if (!this.nimbusUrl.port) {
      const message = `Nimbus URL must specify a port (${this.nimbusUrl.href})`;
      console.error('Error: ' + message);
      throw new TypeError(message);
    }
  }

  /**
   * Getter for nimbus base url. Returned as a clone so the recipient
   * can apply changes safely.
   *
   * @returns URL The base url of our Nimbus instance
   */
  get url(): URL {
    return new URL(this.nimbusUrl.href);
  }

  /**
   * Test if Nimbus is reachable and alive.
   *
   * @returns Promise<boolean>
   */
  async ping(): Promise<boolean> {
    const pingUrl = this.url;
    pingUrl.pathname = NimbusServer.pingPath;
    const options: RequestInit = {
      method: 'GET',
      headers: {},
      redirect: 'manual',
      body: null,
      timeout: NimbusServer.connectionTimeout,
    };
    return new Promise<boolean>((resolve) => {
      fetch(pingUrl, options)
        .then((response: Response) => {
          if (response.ok) {
            resolve(true);
          } else {
            console.error(
              `Error - Unexpected ping status from Nimbus, code:${response.status} - ${response.statusText}'`
            );
            resolve(false);
          }
        })
        .catch((error) => {
          // These are most likely errorFetchError when Nimbus is completely
          // unavailable (e.g. when the sidecar's not running) or AbortError
          // if the request hangs
          console.error(
            `Error - Nimbus server at ${pingUrl.origin} is unreachable: ${error.message}`
          );
          resolve(false);
        });
    });
  }
}

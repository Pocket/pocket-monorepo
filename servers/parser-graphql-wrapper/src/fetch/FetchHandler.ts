import fetch, { Response } from 'node-fetch';
import * as Sentry from '@sentry/node';
import { HTTPResponseErrorFactory } from './HTTPResponseError';
import { serverLogger } from '../server';

type FetchOptions = {
  timeout?: number;
};

export class FetchHandler {
  public static defaultOptions: FetchOptions = {
    timeout: 5000, // 5 Seconds
  };
  constructor(
    // TODO, do we want to do retries?
    private readonly options?: FetchOptions,
  ) {}

  /**
   * Check if response is OK (200 <= response.status < 300).
   * If not, add breadcrumbs with more detailed error information
   * (the error message body text, and the request url)
   * and throw new error with response.status and response.statusText info.
   * @param response Response
   * @returns response if response is OK
   * @throws Error if response is not OK
   */
  private async checkStatus(response: Response) {
    if (response.ok) {
      return response;
    } else {
      const errorBody = await response.text();
      const errorMessage = 'checkStatus: fetch :: DEBUG :: Response Not OK.';
      const errorData = {
        response: response,
        errorBody: errorBody,
        url: response.url,
      };
      serverLogger.error({ message: errorMessage, data: errorData });
      Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
      throw new HTTPResponseErrorFactory(response).getError();
    }
  }

  /**
   * Invoke the fetch function; include a status
   * check and breadcrumbs if the fetch call itself threw
   * an error
   * @returns Resolved promise from fetch, or null if request was aborted
   * @throws Error if fetch promise was rejected
   */
  private async invokeFetch(
    url: string,
    fetchPromise: Promise<Response>,
    timeout: NodeJS.Timeout,
  ): Promise<Response | null> {
    let response: Response;
    try {
      response = await fetchPromise;
    } catch (error) {
      const errorData = {
        url,
        response,
      };
      if (error.name === 'AbortError') {
        const errorMessage = 'invokeFetch: Fetch Request Aborted';
        serverLogger.error({ message: errorMessage, error, data: errorData });
      } else {
        const errorMessage = 'invokeFetch: Fetch Error';
        serverLogger.error({ message: errorMessage, error, data: errorData });
        Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }
    if (response != null) {
      return this.checkStatus(response);
    } else {
      return null;
    }
  }

  /**
   * Fetch a JSON response using node-fetch methods.
   * @returns the JSON payload of the response
   * @throws Error if fetch request threw an error, status was not ok,
   * or JSON could not be parsed.
   */
  public async fetchJSON(
    url: string,
    options?: FetchOptions,
  ): Promise<any | null> {
    const { fetch: fetchPromise, timeout } = this.buildFetch(url, options);
    const response = await this.invokeFetch(url, fetchPromise, timeout);
    let jsonData: any;
    try {
      jsonData = (await response?.json()) || null;
    } catch (error) {
      const errorMessage = 'fetchJSON: Fetch - Error Fetching JSON.';
      const errorData = {
        response: response,
        error: error,
      };
      serverLogger.error({ message: errorMessage, error, data: errorData });
      Sentry.addBreadcrumb({ message: errorMessage, data: errorData });
      throw error;
    }
    return jsonData;
  }

  /**
   * Create a fetch promise with abort signal.
   */
  private buildFetch(
    url: string,
    options?: FetchOptions,
  ): { fetch: Promise<Response>; timeout: NodeJS.Timeout } {
    const requestOptions = {
      ...FetchHandler.defaultOptions,
      ...(options ?? {}),
    };
    const { controller, timeout } = this.abortController(
      requestOptions.timeout,
    );
    return { fetch: fetch(url, { signal: controller.signal }), timeout };
  }

  /**
   * Create an abort signal and start timeout.
   */
  private abortController(timeout: number) {
    const controller = new AbortController();
    // Set the timeout for the abort signal
    const timeoutObj = setTimeout(() => {
      controller.abort();
    }, timeout);
    return { controller, timeout: timeoutObj };
  }
}

import { Response } from 'node-fetch';

export class HTTPResponseErrorFactory {
  private message: string;
  constructor(response: Response) {
    this.message = `HTTP Error Response: ${response.status} ${response.statusText}`;
  }
  public getError() {
    return new Error(this.message);
  }
}

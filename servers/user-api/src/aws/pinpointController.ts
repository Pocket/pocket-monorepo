import config from '../config';
import * as Sentry from '@sentry/node';
import {
  PinpointClient,
  DeleteUserEndpointsCommand,
  DeleteUserEndpointsCommandOutput,
  UpdateEndpointCommand,
  UpdateEndpointCommandOutput,
} from '@aws-sdk/client-pinpoint';
import crypto from 'crypto';

// Methods for managing pinpoint user endpoints
export class PinpointController {
  private readonly fallbackId: string = '000';
  public readonly emailEndpointId: string;
  private client: PinpointClient;

  /**
   * @param userId stringified Pocket userId
   */
  constructor(public readonly userId: string) {
    if (userId === '') {
      throw new Error("Can't create PinpointController for empty userId");
    }
    this.emailEndpointId = crypto
      .createHash('sha256')
      .update(userId)
      .digest('hex');
    this.client = new PinpointClient({ maxAttempts: 3 });
  }

  public async deleteUserEndpoints(): Promise<DeleteUserEndpointsCommandOutput> {
    const command = new DeleteUserEndpointsCommand({
      ApplicationId: config.pinpoint.applicationId,
      UserId: this.userId,
    });
    Sentry.addBreadcrumb({ message: 'Deleting user endpoints from Pinpoint' });
    return await this.client.send(command);
  }

  /**
   * Update the address for a given user endpoint to
   * the provided email. Uses the web repo logic to identify
   * the User's email endpoint ID (hashed userID).
   */
  public async updateUserEndpointEmail(
    email: string,
  ): Promise<UpdateEndpointCommandOutput> {
    const command = new UpdateEndpointCommand({
      ApplicationId: config.pinpoint.applicationId,
      EndpointId: this.emailEndpointId,
      EndpointRequest: { Address: email },
    });
    Sentry.addBreadcrumb({ message: 'Updating user endpoints from Pinpoint' });
    return await this.client.send(command);
  }
}

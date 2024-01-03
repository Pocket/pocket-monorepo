import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as Sentry from '@sentry/serverless';
import config from './config';
import { FxaJwt } from './jwt';
import { sendMessage } from './sqs';
import { SqsEvent, FxaPayload } from './types';

Sentry.AWSLambda.init({
  dsn: config.sentry.dsn,
  release: config.sentry.release,
  environment: config.environment,
  serverName: config.name,
});

/**
 * Format the response data
 * Source: https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html#apigateway-types-transforms
 * @param statusCode
 * @param message
 * @param isError
 */
export function formatResponse(
  statusCode,
  message: string,
  isError?: boolean
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      statusCode,
      [isError ? 'error' : 'message']: message,
    }),
  };
}

/**
 * Generate the data for the SQS messages
 * @param data
 */
export function generateEvents(data: FxaPayload): SqsEvent[] {
  const userId = data.sub;
  const events = data.events;
  const allowedEvents = config.fxa.allowedEvents;

  return Object.keys(events)
    .filter((event) => Object.keys(allowedEvents).includes(event))
    .map((event) => ({
      user_id: userId,
      event: allowedEvents[event],
      timestamp: Math.round(new Date().getTime() / 1000),
      user_email: events[event].fxaEmail ?? events[event].email, //first see if we have an FxA email in an apple migration event, then fallback to email
      transfer_sub: events[event].transferSub ?? null,
    }));
}

/**
 * Create the message for a successful execution
 * If messages fail, update message to point to
 * where the logs are located.
 * @param totalEvents
 * @param failedEvents
 */
export function createSuccessResponseMessage(
  totalEvents: number,
  failedEvents: number
): string {
  const numberOfSuccessfulEvents = totalEvents - failedEvents;
  let message = `Successfully sent ${numberOfSuccessfulEvents} out of ${totalEvents} events to SQS.`;
  if (totalEvents > numberOfSuccessfulEvents) {
    message +=
      ' Review cloudwatch and sentry logs for information about failed events.';
  }

  return message;
}

/**
 * Handle API Gateway Fxa Events
 * Endpoint: /events
 * @param event
 */
export async function eventHandler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  // Get the authorization header
  const authHeader =
    event.headers['Authorization'] ?? event.headers['authorization'];
  if (!authHeader) {
    return formatResponse(400, 'Missing authorization header', true);
  }

  // Split the header to get the parts
  const authHeaderParts = authHeader.split(' ');

  // Make sure it's the correct auth type the first part of the header
  // should be "Bearer"
  if (authHeaderParts[0] !== 'Bearer') {
    return formatResponse(401, 'Invalid auth type', true);
  }
  // Decode the authorization header into the webhook event payload

  let data: FxaPayload;
  try {
    data = await new FxaJwt(authHeaderParts[1]).validate();
  } catch (error) {
    return formatResponse(401, error.message, true);
  }

  // Generate SQS messages
  const sqsEvents = generateEvents(data);
  const totalEvents = sqsEvents.length;

  // If there isn't any valid events, respond early
  if (!totalEvents) {
    return formatResponse(200, 'No valid events');
  }

  // Push events to SQS
  let failedEventCount = 0;
  for (const event of sqsEvents) {
    try {
      await sendMessage(event);
    } catch (error) {
      // Catch the errors but continue to send any remaining events
      failedEventCount += 1;
      console.log(
        `Failed to send event with data: ${JSON.stringify(event)} with error: ${
          error.message
        }`
      );
      Sentry.captureException(error);
    }
  }

  // Response
  return formatResponse(
    200,
    createSuccessResponseMessage(totalEvents, failedEventCount)
  );
}

/**
 * Exported handler function for the lambda.
 * Wrapped in Sentry to provide a more
 * useful context when the unexpected
 * happens.
 */
export const handler = Sentry.AWSLambda.wrapHandler(eventHandler);

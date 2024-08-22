/**
 * Check if the scheduled surface GUID provided is on the list
 * of surfaces needed by Braze.
 *
 * @param name
 */
import config from './config';

/**
 * Check if the date string provided is in YYYY-MM-DD format.
 *
 * @param date
 */
export function validateDate(date: string): void {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;

  if (!date || date.match(regEx) === null) {
    throw new Error(
      'Not a valid date. Please provide a date in YYYY-MM-DD format.',
    );
  }

  return;
}

/**
 * Check if the API request is authorised. We store an API key in AWS Secrets Manager
 * and provide it in Braze email templates so that API calls from Braze succeed.
 *
 * A rather simplistic way to ensure Pocket Hits data is not publicly available
 * before it is sent out, but it is enough for our use case here.
 *
 * @param key
 */
export async function validateApiKey(key: string): Promise<void> {
  // Fail early on no key provided.
  if (!key) {
    throw new Error(config.app.INVALID_API_KEY_ERROR_MESSAGE);
  }

  const storedKey = config.aws.brazeApiKey;

  // Compare the stored key to the one provided by the request to the API.
  if (key !== storedKey) {
    throw new Error(config.app.INVALID_API_KEY_ERROR_MESSAGE);
  }

  return;
}

/**
 *
 * @param imageUrl
 * @param width
 * @param height
 * @param filters
 * @returns image url with resize filters applied
 */
export function getResizedImageUrl(
  imageUrl: string,
  width: number = config.images.width,
  height: number = config.images.height,
  filters: string = config.images.filters,
): string {
  return `${config.images.protocol}://${config.images.host}/${width}x${height}/filters:${filters}/`.concat(
    encodeURIComponent(imageUrl),
  );
}

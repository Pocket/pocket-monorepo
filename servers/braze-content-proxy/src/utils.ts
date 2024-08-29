/**
 * Check if the scheduled surface GUID provided is on the list
 * of surfaces needed by Braze.
 *
 * @param name
 */
import config from './config';
import { InvalidAPIKeyError, InvalidDateError, InvalidUserId } from './errors';

/**
 * Check if the date string provided is in YYYY-MM-DD format.
 *
 * @param date
 */
export function validateDate(date: string): void {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;

  if (!date || date.match(regEx) === null) {
    throw new InvalidDateError();
  }

  return;
}

/**
 * Check if the API request is authorised.
 * The API key is stored in secrets manager and passed in as an ENV variable
 *
 * A rather simplistic way to ensure Pocket Hits data is not publicly available
 * before it is sent out, but it is enough for our use case here.
 *
 * @param key
 */
export function validateApiKey(key: string): void {
  // Fail early on no key provided.
  if (!key) {
    throw new InvalidAPIKeyError();
  }

  const storedKey = config.aws.brazeApiKey;

  // Compare the stored key to the one provided by the request to the API.
  if (key !== storedKey) {
    throw new InvalidAPIKeyError();
  }

  return;
}

export function validateUserId(userId: string): void {
  // Fail early on no userId provided.
  if (!userId) {
    throw new InvalidUserId();
  }
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

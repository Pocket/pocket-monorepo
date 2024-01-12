import { PrismaClient } from '@prisma/client';
import { ForbiddenError, UserInputError } from '@pocket-tools/apollo-utils';

import { IPublicContext } from '../context';
import {
  ACCESS_DENIED_ERROR,
  GT_ENCODED,
  LT_ENCODED,
} from '../../shared/constants';

/**
 * Executes a mutation, catches exceptions and records to sentry and console
 * @param context
 * @param data
 * @param callback
 */
export async function executeMutation<T, U>(
  context: IPublicContext,
  data: T,
  callback: (db, data: T, userId?: number | bigint) => Promise<U>
): Promise<U> {
  const { db, userId } = context;

  const validatedUserId = await validateUserId(db, userId);

  return await callback(db, sanitizeMutationInput(data), validatedUserId);
}

/**
 * Helper function; replaces multiple chars in a string
 * @param str
 * @param charsToFindArr
 * @param replaceWithCharsArr
 */
function replaceCharsInStr(
  str: string,
  charsToFindArr: string[],
  replaceWithCharsArr: string[]
): string {
  for (let i = 0; i < charsToFindArr.length; i++) {
    const regex = new RegExp(charsToFindArr[i], 'g');
    str = str.replace(regex, replaceWithCharsArr[i]);
  }
  return str;
}
/**
 * Sanitizes mutation inputs.
 *
 * @param input
 */
export function sanitizeMutationInput<InputType>(input: InputType): InputType {
  // Either a mutation input object or a primitive type
  let sanitizedInput: any;

  const charsToFindArr = ['>', '<']; // find these chars
  const replaceWithCharsArr = [GT_ENCODED, LT_ENCODED]; // replace with these chars
  if (typeof input === 'object') {
    sanitizedInput = {};

    Object.entries(input).forEach(([key, value]) => {
      // Only transform string values
      sanitizedInput[key] =
        typeof value === 'string'
          ? replaceCharsInStr(value, charsToFindArr, replaceWithCharsArr)
          : value;
    });
  } else {
    sanitizedInput =
      typeof input === 'string'
        ? replaceCharsInStr(input, charsToFindArr, replaceWithCharsArr)
        : input;
  }

  return sanitizedInput;
}

/**
 * Checks that the Pocket user ID is present.
 *
 * @param userId
 */
export async function validateUserId(
  db: PrismaClient,
  userId: number | bigint
): Promise<number | bigint> {
  // We need this check for nearly every query and mutation on the public graph
  if (!userId) {
    throw new ForbiddenError(ACCESS_DENIED_ERROR);
  }

  return userId;
}

/**
 * throws an error if the string value of itemId is not numeric
 *
 * itemId values must be strings when coming in from clients due to legacy
 * issues, yet needs to be stored as a number to match the canonical item
 * database table.
 *
 * @param itemId string
 * @returns void
 */
export function validateItemId(itemId: string) {
  if (!itemId) throw new UserInputError(`itemId is missing`);

  if (
    itemId &&
    (isNaN(itemId as unknown as number) || isNaN(parseInt(itemId)))
  ) {
    throw new UserInputError(`${itemId} is an invalid itemId`);
  }
}

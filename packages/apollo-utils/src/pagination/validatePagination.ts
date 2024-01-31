import { UserInputError } from '../errorHandler/errorHandler';
import { PaginationInput, ValidatedPagination } from './types';

export function validatePagination(
  pagination: PaginationInput | null | undefined,
  defaultPageSize = 30,
  maxPageSize = 100,
  validateCursor = true,
): ValidatedPagination {
  if (pagination == null) {
    return { first: defaultPageSize };
  }
  if (
    (pagination.before && pagination.after) ||
    (pagination.before && pagination.first) ||
    (pagination.last && pagination.after) ||
    (pagination.first && pagination.last)
  ) {
    throw new UserInputError(
      'Please set either {after and first} or {before and last}',
    );
  }

  // Constrain to less than maxPageSize, and if zero, set default
  const constrain = (n: number | undefined): number => {
    if (n == null || n <= 0) {
      return defaultPageSize;
    }
    return Math.min(n, maxPageSize);
  };
  // Validate cursor integer
  const validateCursorFn = (cursor: string) => {
    const cursorInt = parseInt(Buffer.from(cursor, 'base64').toString());
    if (cursorInt < 0) {
      throw new UserInputError('Invalid before cursor');
    }
  };
  if (pagination.before) {
    if (validateCursor) {
      validateCursorFn(pagination.before);
    }
    return { before: pagination.before, last: constrain(pagination.last) };
  } else if (pagination.after) {
    if (validateCursor) {
      validateCursorFn(pagination.after);
    }
    return { after: pagination.after, first: constrain(pagination.first) };
  } else if (pagination.first) {
    return { first: constrain(pagination.first) };
  } else if (pagination.last) {
    return { last: constrain(pagination.last) };
  }
}

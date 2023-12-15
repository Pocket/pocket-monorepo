import { validatePagination } from './validatePagination';

describe('pagination validation', () => {
  const defaultPageSize = 30;
  const maxPageSize = 100;

  it('should throw error if first and last are set', () => {
    const pagination = { first: 100, last: 20 };
    expect(() => validatePagination(pagination)).toThrow(
      'Please set either {after and first} or {before and last}',
    );
  });

  it('should throw error if before and after are set', () => {
    const pagination = { before: 'b_cursor', after: 'a_cursor' };
    expect(() => validatePagination(pagination)).toThrow(
      'Please set either {after and first} or {before and last}',
    );
  });

  it('should throw error if before and first are set', () => {
    const pagination = { before: 'b_cursor', first: 20 };
    expect(() => validatePagination(pagination)).toThrow(
      'Please set either {after and first} or {before and last}',
    );
  });

  it('should throw error when cursor is negative number', () => {
    const before = Buffer.from('-1').toString('base64');
    const pagination = { before: before, last: 10 };
    expect(() =>
      validatePagination(pagination, defaultPageSize, maxPageSize),
    ).toThrow('Invalid before cursor');
  });

  it('should set last to default pagination size if before is set', () => {
    const before = Buffer.from('10').toString('base64');
    const actual = validatePagination(
      { before: before },
      defaultPageSize,
      maxPageSize,
    );
    expect(actual).toEqual({ before: before, last: defaultPageSize });
  });

  it('should set last to default pagination size if its negative', () => {
    const before = Buffer.from('10').toString('base64');
    const actual = validatePagination(
      { before: before, last: -20 },
      defaultPageSize,
      maxPageSize,
    );
    expect(actual).toEqual({ before: before, last: defaultPageSize });
  });

  it('should set first to default pagination size if its negative', () => {
    const after = Buffer.from('10').toString('base64');
    const actual = validatePagination({ after: after, first: -20 });
    expect(actual).toEqual({ after: after, first: defaultPageSize });
  });

  it('should set last to default pagination size if its negative', () => {
    const actual = validatePagination({ last: -20 });
    expect(actual).toEqual({ last: defaultPageSize });
  });

  it('should set first to defaultPageSize if pagination is null', () => {
    const actual = validatePagination(null, 50, 100);
    expect(actual).toEqual({ first: 50 });
  });

  it('should set first to maxPageSize if its greater than maxPageSize', () => {
    const actual = validatePagination({ first: 200 }, 40, 200);
    expect(actual).toEqual({ first: 200 });
  });

  it('should set last to maxPageSize if its greater than maxPageSize', () => {
    const actual = validatePagination({ last: 200 });
    expect(actual).toEqual({ last: maxPageSize });
  });
});

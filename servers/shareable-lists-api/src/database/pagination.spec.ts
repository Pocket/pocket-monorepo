import { OffsetPagination } from './OffsetPagination';

describe('OffsetPagination', () => {
  it('encodes cursor with offset information', () => {
    const cursor = OffsetPagination.encodeCursor(29);
    expect(OffsetPagination.decodeCursor(cursor)).toEqual(29);
  });
  it('decodes cursor and extracts offset', () => {
    const cursor = Buffer.from(
      'abcdef' + OffsetPagination.sentinel + '10',
    ).toString('base64');
    expect(OffsetPagination.decodeCursor(cursor)).toEqual(10);
  });
});

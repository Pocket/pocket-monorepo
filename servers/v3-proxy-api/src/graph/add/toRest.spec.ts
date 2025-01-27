import {
  expectedAddResponses,
  expectedAddResponsePending,
  mockGraphAddResponses,
  mockGraphAddResponsePending,
} from '../../test/fixtures/add';
import { AddItemTransformer } from './toRest';

describe('AddItemTransformer', () => {
  it('should convert pending response to expected result', () => {
    const actual = AddItemTransformer(mockGraphAddResponsePending);
    expect(actual).toEqual(expectedAddResponsePending);
  });
  it('should convert add responses to expected results', () => {
    const actual = mockGraphAddResponses.map((mock) =>
      AddItemTransformer(mock),
    );
    expect(actual).toEqual(expectedAddResponses);
  });
});

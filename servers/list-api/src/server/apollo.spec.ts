import { readClient, writeClient } from '../database/client';
import { contextConnection } from './apollo';

describe('context factory connection', () => {
  describe('should use write connection', () => {
    it('if request starts with "mutation" - no whitespace', () => {
      const testRequest =
        'mutation replaceSavedItemTags($input: [SavedItemTagsInput!]!) { replaceSavedItemTags(input: $input) {url}}';
      const client = contextConnection(testRequest);
      expect(client === writeClient()).toEqual(true);
      expect(client === readClient()).toEqual(false);
    });
    it('if request starts with "mutation" - with whitespace', () => {
      const testRequest =
        '     mutation replaceSavedItemTags($input: [SavedItemTagsInput!]!) { replaceSavedItemTags(input: $input) {url}}';
      const client = contextConnection(testRequest);
      expect(client === writeClient()).toEqual(true);
      expect(client === readClient()).toEqual(false);
    });
    it('if request starts with "mutation" - multiple whitespace kinds', () => {
      const testRequest = `
         mutation replaceSavedItemTags($input: [SavedItemTagsInput!]!) { replaceSavedItemTags(input: $input) {url}}'`;
      const client = contextConnection(testRequest);
      expect(client === writeClient()).toEqual(true);
      expect(client === readClient()).toEqual(false);
    });
  });

  it('should use read connection if query', () => {
    const testRequest = `query myQuery($input: MyQueryInput)`;
    const client = contextConnection(testRequest);
    expect(client === writeClient()).toEqual(false);
    expect(client === readClient()).toEqual(true);
  });
  it('should not use write connection if query, but `mutation` string exists', () => {
    const testRequest = `query myQuery($input: mutation)`;
    const client = contextConnection(testRequest);
    expect(client === writeClient()).toEqual(false);
    expect(client === readClient()).toEqual(true);
  });
});

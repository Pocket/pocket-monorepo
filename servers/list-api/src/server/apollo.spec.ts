import Client from '../database/client.js';
import { contextConnection } from './apollo.js';

describe('context factory connection', () => {
  describe('should use write connection', () => {
    it('if request starts with "mutation" - no whitespace', () => {
      const testRequest =
        'mutation replaceSavedItemTags($input: [SavedItemTagsInput!]!) { replaceSavedItemTags(input: $input) {url}}';
      const client = contextConnection(testRequest);
      expect(client === Client.writeClient()).toEqual(true);
      expect(client === Client.readClient()).toEqual(false);
    });
    it('if request starts with "mutation" - with whitespace', () => {
      const testRequest =
        '     mutation replaceSavedItemTags($input: [SavedItemTagsInput!]!) { replaceSavedItemTags(input: $input) {url}}';
      const client = contextConnection(testRequest);
      expect(client === Client.writeClient()).toEqual(true);
      expect(client === Client.readClient()).toEqual(false);
    });
    it('if request starts with "mutation" - multiple whitespace kinds', () => {
      const testRequest = `
         mutation replaceSavedItemTags($input: [SavedItemTagsInput!]!) { replaceSavedItemTags(input: $input) {url}}'`;
      const client = contextConnection(testRequest);
      expect(client === Client.writeClient()).toEqual(true);
      expect(client === Client.readClient()).toEqual(false);
    });
  });

  it('should use read connection if query', () => {
    const testRequest = `query myQuery($input: MyQueryInput)`;
    const client = contextConnection(testRequest);
    expect(client === Client.writeClient()).toEqual(false);
    expect(client === Client.readClient()).toEqual(true);
  });
  it('should not use write connection if query, but `mutation` string exists', () => {
    const testRequest = `query myQuery($input: mutation)`;
    const client = contextConnection(testRequest);
    expect(client === Client.writeClient()).toEqual(false);
    expect(client === Client.readClient()).toEqual(true);
  });
});

import { expect } from 'chai';

import { UserInputError } from '@pocket-tools/apollo-utils';

import {
  CreateShareableListInput,
  CreateShareableListItemInput,
} from '../../database/types';
import { sanitizeMutationInput, validateItemId } from './utils';

describe('utility functions', () => {
  describe('validateItemId', () => {
    it('does throw an error for a missing or empty itemId', () => {
      expect(() => {
        validateItemId(null);
      }).to.throw(UserInputError);

      expect(() => {
        validateItemId(undefined);
      }).to.throw(UserInputError);

      expect(() => {
        validateItemId('');
      }).to.throw(UserInputError);
    });

    it('throws an error for a non-numeric itemId', () => {
      expect(() => {
        validateItemId('1234asdf5678');
      }).to.throw(UserInputError);

      expect(() => {
        validateItemId('asdf12345678');
      }).to.throw(UserInputError);

      expect(() => {
        validateItemId('12345678asdf');
      }).to.throw(UserInputError);

      expect(() => {
        validateItemId('asdf');
      }).to.throw(UserInputError);
    });

    it('does not throw for a numeric itemId', () => {
      expect(() => {
        validateItemId('123456789');
      }).not.to.throw();
    });
  });
  describe('sanitizeMutationInput', () => {
    it('transforms strings in a mutation input object', () => {
      const input: CreateShareableListInput = {
        title: `John's <div> list </div>`,
        description:
          'Trying out this new Pocket feature<script>alert("!!!");</script>',
      };

      const safeInput = sanitizeMutationInput(input);

      expect(safeInput.title).to.equal(`John's &lt;div&gt; list &lt;/div&gt;`);
      expect(safeInput.description).to.equal(
        'Trying out this new Pocket feature&lt;script&gt;alert("!!!");&lt;/script&gt;'
      );
    });

    it('returns numeric values as-is in a mutation input object', () => {
      const input: CreateShareableListItemInput = {
        listExternalId: '123-abc',
        itemId: '456789',
        url: 'https://www.test.com/story',
        title: 'This is a test title',
        excerpt: 'An excerpt sounds like a good thing to have',
        imageUrl: 'https://www.test.com/<script>alert("hello world");</script>',
        publisher: 'House of Random Penguins',
        authors: 'Charles Dickens',
        sortOrder: 10,
      };

      const safeInput = sanitizeMutationInput(input);

      // dodgy strings are still escaped
      expect(safeInput.imageUrl).to.equal(
        'https://www.test.com/&lt;script&gt;alert("hello world");&lt;/script&gt;'
      );

      // numeric inputs go through as-is
      expect(safeInput.itemId).to.equal(input.itemId);
      expect(safeInput.sortOrder).to.equal(input.sortOrder);
    });

    it('sanitises strings', () => {
      const externalId = 'uuid-something-1234<script>';

      const safeInput = sanitizeMutationInput(externalId);

      expect(safeInput).to.equal('uuid-something-1234&lt;script&gt;');
    });

    it('returns numeric values as-is', () => {
      const sortOrder = 12345;

      const safeInput = sanitizeMutationInput(sortOrder);

      expect(safeInput).to.equal(sortOrder);
    });
  });
});

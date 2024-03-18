import {
  ItemActionSanitizer,
  ItemAddActionSanitizer,
  ItemTagActionSanitizer,
  TagDeleteActionSanitizer,
  TagRenameActionSanitizer,
} from './SendActionValidators';

describe('send validator', () => {
  describe('for item actions', () => {
    it.each([
      // All possible actions
      {
        input: { item_id: '12345', action: 'favorite' as const },
        expected: { itemId: 12345, action: 'favorite' },
      },
      {
        input: { item_id: '12345', action: 'unfavorite' as const },
        expected: { itemId: 12345, action: 'unfavorite' },
      },
      {
        input: { item_id: '12345', action: 'readd' as const },
        expected: { itemId: 12345, action: 'readd' },
      },
      {
        input: { item_id: '12345', action: 'archive' as const },
        expected: { itemId: 12345, action: 'archive' },
      },
      {
        input: { item_id: '12345', action: 'delete' as const },
        expected: { itemId: 12345, action: 'delete' },
      },
      {
        input: { url: 'http://domain.com/path', action: 'delete' as const },
        expected: { url: 'http://domain.com/path', action: 'delete' },
      },
      {
        input: {
          item_id: '12345',
          url: 'http://domain.com/path',
          action: 'delete' as const,
        },
        expected: {
          itemId: 12345,
          url: 'http://domain.com/path',
          action: 'delete',
        },
      },
      // Optional time field
      {
        input: {
          item_id: '12345',
          action: 'delete' as const,
          time: '192392329',
        },
        expected: {
          itemId: 12345,
          action: 'delete' as const,
          time: 192392329,
        },
      },
      // Ignores additional input
      {
        input: {
          item_id: '12345',
          action: 'delete' as const,
          time: '192392329',
          extra: 'abc123',
        },
        expected: { itemId: 12345, action: 'delete', time: 192392329 },
      },
    ])('sanitizes valid input', ({ input, expected }) => {
      const res = new ItemActionSanitizer(input).validate();
      expect(res).toEqual(expected);
    });
    it.each([
      {
        input: { action: 'favorite' as const },
        error: 'Action must have one of `item_id` or `url`',
      },
      // Invalid item_id
      {
        input: { action: 'favorite' as const, item_id: '' },
        error: 'Invalid item_id:',
      },
      // Invalid item_id (must be numeric)
      {
        input: { action: 'favorite' as const, item_id: '123abc' },
        error: 'Invalid item_id:',
      },
      // Invalid url
      {
        input: { action: 'favorite' as const, url: 'this is not a url' },
        error: 'Invalid url:',
      },
      {
        input: { action: 'favorite' as const, url: '' },
        error: 'Invalid url:',
      },
      // Invalid time
      {
        input: {
          action: 'favorite' as const,
          item_id: '123',
          time: '2023-12-20', // tricky, can be natively parsed to int
        },
        error: 'Invalid time:',
      },
      {
        input: {
          action: 'favorite' as const,
          item_id: '123',
          time: '',
        },
        error: 'Invalid time:',
      },
    ])('throws error for invalid input', ({ input, error }) => {
      expect.assertions(1);
      try {
        new ItemActionSanitizer(input).validate();
      } catch (err) {
        expect(err.message).toContain(error);
      }
    });
  });
  describe('for item-tag actions', () => {
    it.each([
      // All possible actions
      {
        input: {
          item_id: '12345',
          action: 'tags_add' as const,
          tags: 'perilous,supplemental',
        },
        expected: {
          itemId: 12345,
          action: 'tags_add',
          tags: ['perilous', 'supplemental'],
        },
      },
      {
        input: {
          item_id: '12345',
          action: 'tags_replace' as const,
          tags: 'perilous,supplemental',
        },
        expected: {
          itemId: 12345,
          action: 'tags_replace',
          tags: ['perilous', 'supplemental'],
        },
      },
      {
        input: {
          item_id: '12345',
          action: 'tags_remove' as const,
          tags: 'perilous,supplemental',
        },
        expected: {
          itemId: 12345,
          action: 'tags_remove',
          tags: ['perilous', 'supplemental'],
        },
      },
      {
        input: {
          item_id: '12345',
          action: 'tags_remove' as const,
          tags: 'perilous',
        },
        expected: {
          itemId: 12345,
          action: 'tags_remove',
          tags: ['perilous'],
        },
      },
      {
        input: {
          url: 'http://domain.com/path',
          action: 'tags_remove' as const,
          tags: 'perilous,supplemental',
        },
        expected: {
          url: 'http://domain.com/path',
          action: 'tags_remove',
          tags: ['perilous', 'supplemental'],
        },
      },
      {
        input: {
          item_id: '12345',
          url: 'http://domain.com/path',
          action: 'tags_remove' as const,
          tags: 'perilous,supplemental',
        },
        expected: {
          itemId: 12345,
          url: 'http://domain.com/path',
          action: 'tags_remove',
          tags: ['perilous', 'supplemental'],
        },
      },
      // Optional time
      {
        input: {
          url: 'http://domain.com/path',
          action: 'tags_remove' as const,
          tags: 'perilous,supplemental',
          time: '123245',
        },
        expected: {
          url: 'http://domain.com/path',
          action: 'tags_remove',
          tags: ['perilous', 'supplemental'],
          time: 123245,
        },
      },
    ])('sanitizes valid input', ({ input, expected }) => {
      const res = new ItemTagActionSanitizer(input).validate();
      expect(res).toEqual(expected);
    });
    it.each([
      // Invalid item_id
      {
        input: { action: 'tags_add' as const, item_id: '', tags: 'perilous' },
        error: 'Invalid item_id:',
      },
      // Invalid item_id (must be numeric)
      {
        input: {
          action: 'tags_add' as const,
          item_id: '123abc',
          tags: 'perilous',
        },
        error: 'Invalid item_id:',
      },
      // Invalid url
      {
        input: {
          action: 'tags_add' as const,
          url: 'this is not a url',
          tags: 'perilous',
        },
        error: 'Invalid url:',
      },
      {
        input: { action: 'tags_add' as const, url: '', tags: 'perilous' },
        error: 'Invalid url:',
      },
      // Invalid time
      {
        input: {
          action: 'tags_add' as const,
          item_id: '123',
          time: '2023-12-20', // tricky, can be natively parsed to int
          tags: 'perilous',
        },
        error: 'Invalid time:',
      },
      {
        input: {
          action: 'tags_add' as const,
          item_id: '123',
          time: '',
          tags: 'perilous',
        },
        error: 'Invalid time:',
      },
      // Invalid tags
      {
        input: {
          action: 'tags_add' as const,
          item_id: '123',
        },
        error: 'Action must have tags field',
      },
      {
        input: {
          action: 'tags_add' as const,
          item_id: '123',
          tags: '',
        },
        error: 'Tag cannot be an empty string',
      },
      {
        input: {
          action: 'tags_add' as const,
          item_id: '123',
          tags: 'perilous,,supplemental',
        },
        error: 'Tag cannot be an empty string',
      },
    ])('throws error for invalid input', ({ input, error }) => {
      expect.assertions(1);
      try {
        new ItemTagActionSanitizer(input).validate();
      } catch (err) {
        expect(err.message).toContain(error);
      }
    });
  });
  describe('for tag rename action', () => {
    it.each([
      {
        input: {
          old_tag: 'perilous',
          new_tag: 'dangerous',
          action: 'tag_rename' as const,
        },
        expected: {
          oldTag: 'perilous',
          newTag: 'dangerous',
          action: 'tag_rename',
        },
      },
      // Optional time field
      {
        input: {
          old_tag: 'perilous',
          new_tag: 'dangerous',
          action: 'tag_rename' as const,
          time: '192392329',
        },
        expected: {
          oldTag: 'perilous',
          newTag: 'dangerous',
          action: 'tag_rename' as const,
          time: 192392329,
        },
      },
      // Ignores additional input
      {
        input: {
          item_id: '12345', // unused
          old_tag: 'perilous',
          new_tag: 'dangerous',
          action: 'tag_rename' as const,
        },
        expected: {
          oldTag: 'perilous',
          newTag: 'dangerous',
          action: 'tag_rename',
        },
      },
    ])('sanitizes valid input', ({ input, expected }) => {
      const res = new TagRenameActionSanitizer(input).validate();
      expect(res).toEqual(expected);
    });
    it.each([
      {
        input: {
          action: 'tag_rename' as const,
          old_tag: 'perilous',
        },
        error: 'Action must have non-empty new_tag field',
      },
      {
        input: {
          action: 'tag_rename' as const,
          old_tag: 'perilous',
          new_tag: '',
        },
        error: 'Action must have non-empty new_tag field',
      },
      {
        input: {
          action: 'tag_rename' as const,
          new_tag: 'dangerous',
        },
        error: 'Action must have non-empty old_tag field',
      },
      {
        input: {
          action: 'tag_rename' as const,
          old_tag: '',
          new_tag: 'dangerous',
        },
        error: 'Action must have non-empty old_tag field',
      },
    ])('throws error for invalid input', ({ input, error }) => {
      expect.assertions(1);
      try {
        new TagRenameActionSanitizer(input).validate();
      } catch (err) {
        expect(err.message).toContain(error);
      }
    });
  });
  describe('for tag delete action', () => {
    it.each([
      {
        input: {
          tag: 'perilous',
          action: 'tag_delete' as const,
        },
        expected: {
          tag: 'perilous',
          action: 'tag_delete',
        },
      },
      // Optional time field
      {
        input: {
          tag: 'perilous',
          action: 'tag_delete' as const,
          time: '123423423423',
        },
        expected: {
          tag: 'perilous',
          action: 'tag_delete',
          time: 123423423423,
        },
      },
      // Ignores additional input
      {
        input: {
          tag: 'loud',
          old_tag: 'perilous',
          new_tag: 'dangerous',
          action: 'tag_delete' as const,
        },
        expected: {
          tag: 'loud',
          action: 'tag_delete',
        },
      },
    ])('sanitizes valid input', ({ input, expected }) => {
      const res = new TagDeleteActionSanitizer(input).validate();
      expect(res).toEqual(expected);
    });
    it.each([
      {
        input: {
          action: 'tag_delete' as const,
        },
        error: 'Action must have non-empty tag field',
      },
      {
        input: {
          action: 'tag_delete' as const,
          tag: '',
        },
        error: 'Action must have non-empty tag field',
      },
      // Invalid time
      {
        input: {
          action: 'tag_delete' as const,
          tag: 'supplemental',
          time: '2023-12-20', // tricky, can be natively parsed to int
        },
        error: 'Invalid time:',
      },
      {
        input: {
          action: 'tag_delete' as const,
          tag: 'supplemental',
          time: '',
        },
        error: 'Invalid time:',
      },
    ])('throws error for invalid input', ({ input, error }) => {
      expect.assertions(1);
      try {
        new TagDeleteActionSanitizer(input).validate();
      } catch (err) {
        expect(err.message).toContain(error);
      }
    });
  });
  describe('for item add action', () => {
    it.each([
      {
        input: { url: 'http://domain.com/path', action: 'add' as const },
        expected: { url: 'http://domain.com/path', action: 'add' },
      },
      // I guess this evaluates to readd, technically it's valid
      {
        input: { item_id: '12323', action: 'add' as const },
        expected: { itemId: 12323, action: 'add' },
      },
      // Another technically valid...
      {
        input: {
          item_id: '12345',
          url: 'http://domain.com/path',
          action: 'add' as const,
        },
        expected: {
          itemId: 12345,
          url: 'http://domain.com/path',
          action: 'add',
        },
      },
      // Optional time field
      {
        input: {
          url: 'http://domain.com/path',
          action: 'add' as const,
          time: '192392329',
        },
        expected: {
          url: 'http://domain.com/path',
          action: 'add' as const,
          time: 192392329,
        },
      },
      // optional title
      {
        input: {
          url: 'http://domain.com/path',
          action: 'add' as const,
          title: 'Heavenly Guardian Defense',
        },
        expected: {
          url: 'http://domain.com/path',
          action: 'add',
          title: 'Heavenly Guardian Defense',
        },
      },
      // optional tags
      {
        input: {
          url: 'http://domain.com/path',
          action: 'add' as const,
          tags: 'perilous,decisive-only',
        },
        expected: {
          url: 'http://domain.com/path',
          action: 'add',
          tags: ['perilous', 'decisive-only'],
        },
      },
      // all optional metadata possible
      {
        input: {
          url: 'http://domain.com/path',
          action: 'add' as const,
          title: 'Heavenly Guardian Defense',
          tags: 'perilous,decisive-only',
          time: '12312323232',
        },
        expected: {
          url: 'http://domain.com/path',
          action: 'add',
          title: 'Heavenly Guardian Defense',
          tags: ['perilous', 'decisive-only'],
          time: 12312323232,
        },
      },
      // Ignores additional input
      {
        input: {
          url: 'http://domain.com/path',
          action: 'add' as const,
          time: '192392329',
          extra: 'abc123',
        },
        expected: {
          url: 'http://domain.com/path',
          action: 'add',
          time: 192392329,
        },
      },
    ])('sanitizes valid input', ({ input, expected }) => {
      const res = new ItemAddActionSanitizer(input).validate();
      expect(res).toEqual(expected);
    });
    it.each([
      // Missing required field
      {
        input: {
          action: 'add' as const,
        },
        error: 'Action must have one of `item_id` or `url`',
      },
      {
        input: {
          action: 'add' as const,
          url: 'not a url',
        },
        error: 'Invalid url:',
      },
      {
        input: {
          action: 'add' as const,
          item_id: 'abc123',
        },
        error: 'Invalid item_id:',
      },
      {
        input: {
          action: 'add' as const,
          url: 'http://domain.com/path',
          time: '2023-20-12',
        },
        error: 'Invalid time:',
      },
      {
        input: {
          action: 'add' as const,
          url: 'http://domain.com/path',
          title: '',
        },
        error: 'Field title must be a non-empty string',
      },
      {
        input: {
          action: 'add' as const,
          url: 'http://domain.com/path',
          tags: '',
        },
        error: 'Tag cannot be an empty string',
      },
      {
        input: {
          action: 'add' as const,
          url: 'http://domain.com/path',
          tags: 'perilous,',
        },
        error: 'Tag cannot be an empty string',
      },
    ])('throws error for invalid input', ({ input, error }) => {
      expect.assertions(1);
      try {
        new ItemAddActionSanitizer(input).validate();
      } catch (err) {
        expect(err.message).toContain(error);
      }
    });
  });
});

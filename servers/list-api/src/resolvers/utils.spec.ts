import { SavedItemTagsInput, Tag } from '../types';
import { getSavedItemMapFromTags, getSavedItemTagsMap } from './utils';

describe('getSavedItemMapFromTags', () => {
  it('should return a savedItem map from a list of tags', () => {
    const tagA: Tag = { id: 'id1', name: 'tagA', savedItems: ['1', '2'] };
    const tagB: Tag = { id: 'id2', name: 'tagB', savedItems: ['1', '3'] };
    const input: Tag[] = [tagA, tagB];

    const expected = { '1': [tagA, tagB], '2': [tagA], '3': [tagB] };
    const actual = getSavedItemMapFromTags(input);
    expect(actual).toEqual(expected);
  });
});

describe('getSavedItemTagsMap', () => {
  it('should return savedItemTagsMap from list of duplicated SavedItemTagsInput', () => {
    const savedItemTagsInput: SavedItemTagsInput[] = [
      {
        savedItemId: '1',
        tags: ['tagA', 'tagA'],
      },
      {
        savedItemId: '1',
        tags: ['tagA', 'tagB'],
      },
      {
        savedItemId: '1',
        tags: ['tagC', 'tagD'],
      },
      {
        savedItemId: '2',
        tags: ['tagC', 'tagD'],
      },
    ];

    const map = getSavedItemTagsMap(savedItemTagsInput);
    expect(map['1']).toEqual(['tagA', 'tagB', 'tagC', 'tagD']);
    expect(map['2']).toEqual(['tagC', 'tagD']);
  });
});

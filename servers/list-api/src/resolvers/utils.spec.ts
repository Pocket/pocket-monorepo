import { SavedItemTagsInput, Tag } from '../types';
import {
  atLeastOneOf,
  getSavedItemMapFromTags,
  getSavedItemTagsMap,
} from './utils';

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
describe('atLeastOneOf', () => {
  it('returns false if no keys are included', () => {
    const hasAtLeastOne = atLeastOneOf({ spell: undefined, level: undefined }, [
      'spell',
      'level',
    ]);
    expect(hasAtLeastOne).toBeFalse();
  });
  it('returns false if there are other keys but not the ones you want', () => {
    const hasAtLeastOne = atLeastOneOf(
      { spell: undefined, level: undefined, range: '3m' },
      ['spell', 'level'],
    );
    expect(hasAtLeastOne).toBeFalse();
  });
  it('passes if at least one key is included', () => {
    const hasAtLeastOne = atLeastOneOf(
      { spell: 'Speak With Dead', level: 2, range: '3m' },
      ['spell', 'level'],
    );
    expect(hasAtLeastOne).toBeTrue();
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

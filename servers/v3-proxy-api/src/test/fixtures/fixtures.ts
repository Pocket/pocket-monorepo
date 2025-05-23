import {
  Imageness,
  SavedItemStatus,
  Videoness,
  SavedItemSimpleFragment,
  ItemSimpleFragment,
} from '../../generated/graphql/types';
import { ListItemObject, GetResponseSimple } from '../../graph/types';

export const seedDataRest: MockListItemObject = Object.freeze({
  ids: ['1', '2'],
  given_url: 'https://test.com',
  given_title: 'given title',
  favorite: '1',
  status: '1',
  time_added: '1706732550',
  time_updated: '1706732550',
  time_read: '1706732550',
  time_favorited: '1706732550',
  resolved_title: 'title',
  resolved_url: 'https://test.com',
  excerpt: 'excerpt',
  is_article: '1',
  is_index: '1',
  has_video: '1',
  has_image: '1',
  word_count: '100',
  lang: 'en',
  time_to_read: 10,
  top_image_url: 'https://test.com/image.jpg',
  normal_url: 'test.com',
  sort_id: 1,
  listen_duration_estimate: 0,
});

export type SavedItemFragment = Omit<SavedItemSimpleFragment, 'item'>;
export const mockSavedItemFragment: SavedItemFragment = {
  __typename: 'SavedItem',
  id: '1',
  status: SavedItemStatus.Archived,
  url: seedDataRest.given_url,
  isFavorite: seedDataRest.favorite === '1',
  isArchived: true,
  title: seedDataRest.given_title,
  _createdAt: parseInt(seedDataRest.time_added),
  _updatedAt: parseInt(seedDataRest.time_updated),
  favoritedAt: parseInt(seedDataRest.time_favorited),
  archivedAt: parseInt(seedDataRest.time_read),
};

export const mockItemFragment: ItemSimpleFragment = {
  __typename: 'Item',
  itemId: `item-${seedDataRest.ids[0]}`,
  preview: {
    __typename: 'ItemSummary',
    title: 'title',
    url: seedDataRest.resolved_url,
    excerpt: seedDataRest.excerpt,
    image: {
      url: seedDataRest.top_image_url,
    },
  },
  resolvedId: `resolved-${seedDataRest.ids[0]}`,
  wordCount: parseInt(seedDataRest.word_count),
  timeToRead: seedDataRest.time_to_read,
  resolvedUrl: seedDataRest.resolved_url,
  givenUrl: seedDataRest.given_url,
  domain: 'test.com', // mock to seedDataRest when needed
  isArticle: seedDataRest.is_article === '1',
  isIndex: seedDataRest.is_index === '1',
  hasVideo: Videoness.HasVideos,
  hasImage: Imageness.HasImages,
  language: seedDataRest.lang,
};

/**
 * function to return saved item fragment
 * used default mockSavedItemFragment if values are not added explicitly
 * @param mockInput mock saved item fragment
 */
export const testSavedItemFragment = (
  mockInput: SavedItemFragment = mockSavedItemFragment,
): SavedItemFragment => {
  return mockInput;
};

/**
 * function to return test Item fragment
 * used default mockItemFragment if values are not added explicitly
 * todo: refactor mockInput types as you add more fields other than itemIds
 * @param mockInput necessary inputs required for populating mock Item
 */
export const testItemFragment = (mockInput: {
  itemId: string;
  __typename: 'PendingItem' | 'Item';
}): ItemSimpleFragment => {
  return {
    ...mockItemFragment,
    itemId: mockInput.itemId,
    resolvedId: `resolved-${mockInput.itemId}`,
  };
};

type MockListItemObject = Omit<ListItemObject, 'item_id' | 'resolved_id'> & {
  ids: string[];
};
/**
 * return REST v3 GET response for given Ids
 * @param ids
 */
export const testV3GetResponse = (
  mockInputs: MockListItemObject = {
    ...seedDataRest,
  },
): GetResponseSimple => {
  const map: { [key: string]: ListItemObject } = {};

  mockInputs.ids.forEach((id, index) => {
    map[id] = {
      item_id: id,
      resolved_id: `resolved-${id}`,
      given_title: mockInputs.given_title,
      given_url: mockInputs.given_url,
      favorite: mockInputs.favorite,
      status: mockInputs.status,
      time_added: mockInputs.time_added,
      time_updated: mockInputs.time_updated,
      time_read: mockInputs.time_read,
      time_favorited: mockInputs.time_favorited,
      resolved_title: mockInputs.resolved_title,
      resolved_url: mockInputs.resolved_url,
      excerpt: mockInputs.excerpt,
      is_article: mockInputs.is_article,
      is_index: mockInputs.is_index,
      has_video: mockInputs.has_video,
      has_image: mockInputs.has_image,
      word_count: mockInputs.word_count,
      lang: mockInputs.lang,
      time_to_read: mockInputs.time_to_read,
      top_image_url: mockInputs.top_image_url,
      listen_duration_estimate: 0,
      sort_id: index,
    };
  });

  return {
    complete: 1,
    status: 1,
    error: null,
    since: 1706732550,
    maxActions: 30,
    cachetype: 'db',
    list: map,
  };
};

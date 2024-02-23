import {
  Imageness,
  SavedItemStatus,
  Videoness,
  SavedItemSimpleFragment,
  ItemSimpleFragment,
  SavedItemCompleteFragment,
  ItemCompleteFragment,
} from '../generated/graphql/types';
import { ListItemObject, RestResponseSimple } from './types';
export const seedDataRest: MockListItemObject = Object.freeze({
  ids: ['1', '2'],
  given_url: 'https://test.com',
  given_title: 'title',
  favorite: '1',
  status: '0',
  time_added: '1677818995',
  time_updated: '1677818995',
  time_read: '1677818995',
  time_favorited: '1677818995',
  resolved_title: 'title',
  resolved_url: 'https://test.com',
  title: 'title',
  excerpt: 'excerpt',
  is_article: '1',
  is_index: '1',
  has_video: '1',
  has_image: '1',
  word_count: '100',
  lang: 'en',
  time_to_read: 10,
  amp_url: 'https://test.com',
  top_image_url: 'https://test.com/image.jpg',
  normal_url: 'test.com',
  sort_id: 1,
  listen_duration_estimate: 0,
});

export type SavedItemFragment = Omit<SavedItemSimpleFragment, 'item'>;
export const mockSavedItemFragment: SavedItemFragment = {
  __typename: 'SavedItem',
  id: '1',
  status: SavedItemStatus.Unread,
  url: seedDataRest.given_url,
  isFavorite: seedDataRest.favorite === '1',
  isArchived: true, //todo: map status to archived
  _createdAt: parseInt(seedDataRest.time_added),
  _updatedAt: parseInt(seedDataRest.time_updated),
  favoritedAt: parseInt(seedDataRest.time_favorited),
  archivedAt: parseInt(seedDataRest.time_read),
};
export const mockSavedItemCompleteFragment: Omit<
  SavedItemCompleteFragment,
  'item'
> = {
  ...mockSavedItemFragment,
};
export const mockItemFragment: ItemSimpleFragment = {
  __typename: 'Item',
  itemId: `item-${seedDataRest.ids[0]}`,
  resolvedId: `resolved-${seedDataRest.ids[0]}`,
  wordCount: parseInt(seedDataRest.word_count),
  title: seedDataRest.title,
  timeToRead: seedDataRest.time_to_read,
  resolvedUrl: seedDataRest.resolved_url,
  givenUrl: seedDataRest.given_url,
  excerpt: seedDataRest.excerpt,
  domain: 'test.com', // mock to seedDataRest when needed
  isArticle: seedDataRest.is_article === '1',
  isIndex: seedDataRest.is_index === '1',
  hasVideo: Videoness.HasVideos,
  hasImage: Imageness.HasImages,
  language: seedDataRest.lang,
  ampUrl: seedDataRest.amp_url,
  topImage: {
    url: seedDataRest.top_image_url,
  },
};

export const mockItemCompleteFragment: ItemCompleteFragment = {
  ...mockItemFragment,
  authors: [{ id: '1ab' }],
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
 * //todo: need to include tags, images, videoes etc
 * //todo: map top level fields and sort_id
 * @param ids
 */
export const testV3GetResponse = (
  mockInputs: MockListItemObject = {
    ...seedDataRest,
  },
): RestResponseSimple => {
  const map: { [key: string]: ListItemObject } = {};

  mockInputs.ids.forEach((id, index) => {
    map[id] = {
      item_id: id,
      resolved_id: `resolved-${id}`,
      title: mockInputs.title,
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
      amp_url: mockInputs.amp_url,
      top_image_url: mockInputs.top_image_url,
      listen_duration_estimate: 0,
      sort_id: index,
    };
  });

  return {
    cacheType: 'db',
    list: map,
  };
};

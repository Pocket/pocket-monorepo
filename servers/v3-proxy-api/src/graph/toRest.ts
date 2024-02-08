/**
 * method to convert graph responses to REST responses
 */

import {
  GetSavedItemsQuery,
  Imageness,
  Videoness,
} from '../generated/graphql/types';
import {
  GraphItem,
  GraphSavedItem,
  GraphSavedItemEdge,
  ListItemObject,
  RestResponse,
} from './types';

/**
 * process if the item fields are populated. if its pendingItem, we just return null
 * @param savedItem
 */

function convertHasImage(imageStatus: Imageness) {
  switch (imageStatus) {
    case Imageness.IsImage:
    case Imageness.HasImages:
      return '1';
    case Imageness.NoImages:
      return '0';
    default:
      return '0';
  }
}

function convertHasVideo(videoStatus: Videoness) {
  switch (videoStatus) {
    case Videoness.HasVideos:
    case Videoness.IsVideo:
      return '1';
    case Videoness.NoVideos:
      return '0';
    default:
      return '0';
  }
}

/**
 * converts list to map
 * @param input list of entities
 * @param key key to assign the entity
 */
function listToMap<T>(input: T[], key: string): { [key: string]: T } {
  return input.reduce((map, item) => {
    map[item[key]] = item;
    return map;
  }, {});
}

/**
 * converts saves.Items to REST response.
 * sets the listItem as null for PendingItem
 * @param savedItemEdge savedItem edge from the graph
 */
const reduceItem = (savedItemEdge: GraphSavedItemEdge): ListItemObject => {
  switch (savedItemEdge.node.item.__typename) {
    case 'Item':
      return convertGraphSavedItemToListObject(savedItemEdge.node);
    case 'PendingItem':
      return null;
  }
};
export function convertGraphSavedItemToListObject(
  savedItem: GraphSavedItem
): ListItemObject {
  const nestedItem: GraphItem = savedItem.item as GraphItem;
  return {
    item_id: savedItem.id,
    resolved_id: nestedItem.resolvedId,
    given_url: nestedItem.givenUrl,
    given_title: nestedItem.title,
    favorite: savedItem.isFavorite ? '1' : '0',
    status: savedItem.isArchived ? '0' : '1',
    time_added: savedItem._createdAt?.toString(),
    time_updated: savedItem._updatedAt?.toString(),
    time_read: savedItem.archivedAt?.toString(),
    time_favorited: savedItem.favoritedAt?.toString(),
    resolved_title: nestedItem.title,
    resolved_url: nestedItem.resolvedUrl,
    title: nestedItem.title,
    excerpt: nestedItem.excerpt,
    is_article: nestedItem.isArticle ? '1' : '0',
    is_index: nestedItem.isIndex ? '1' : '0',
    has_video: convertHasVideo(nestedItem.hasVideo),
    has_image: convertHasImage(nestedItem.hasImage),
    word_count: nestedItem.wordCount?.toString(),
    lang: nestedItem.language,
    time_to_read: nestedItem.timeToRead,
    amp_url: nestedItem.ampUrl,
    top_image_url: nestedItem.topImage?.url,
  };
}

/**
 * converts graphql response to rest response
 * todo: map top level fields as a part of v3/get implementation ticket
 * @param response
 */
export function convertSavedItemsToRestResponse(
  response: GetSavedItemsQuery
): RestResponse {
  return {
    // todo: map top level fields
    cacheType: 'db',
    list: listToMap(
      response.user.savedItems.edges.map(reduceItem).filter((s) => s !== null),
      'item_id'
    ),
  };
}

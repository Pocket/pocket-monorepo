import { gql } from 'graphql-tag';
import { mysqlTimeString } from '../../dataservices/utils';
import config from '../../config';

export const GET_HIGHLIGHTS = gql`
  query GetHighlights($itemId: ID) {
    _entities(representations: { id: $itemId, __typename: "SavedItem" }) {
      ... on SavedItem {
        annotations {
          highlights {
            id
            patch
            version
            quote
            _createdAt
            _updatedAt
          }
        }
      }
    }
  }
`;
export const seedData = (now) => ({
  users_meta: [
    {
      user_id: 1,
      property: 41,
      value: mysqlTimeString(now, config.database.tz),
      time_updated: now, // Web repo uses NOW() instead of server timestamp
    },
  ],
  user_annotations: [
    {
      // One highlight on an item
      annotation_id: 'b3a95dd3-dd9b-49b0-bb72-dc6daabd809b',
      user_id: 1,
      item_id: 1,
      quote: "'We should rewrite it all,' said Pham.",
      patch: 'patch1',
      version: 1,
      status: 1,
      updated_at: now,
      created_at: now,
    },
    {
      // > 1 annotations on an item
      annotation_id: 'aafa87bc-9742-416c-a517-e3cd801f2761',
      user_id: 1,
      item_id: 2,
      quote:
        'You and a thousand of your friends would have to work for a century or so to reproduce it.',
      patch: 'patch2',
      version: 1,
      status: 1,
      updated_at: now,
      created_at: now,
    },
    {
      annotation_id: '29de0654-a2ab-4df3-afc2-3d0d8d29ecbe',
      user_id: 1,
      item_id: 2,
      quote: "The word for all this is 'mature programming environment.'",
      patch: 'patch3',
      version: 1,
      status: 1,
      updated_at: now,
      created_at: now,
    },
    {
      annotation_id: 'ec9b0dbd-ebd7-43fd-b296-083bac8fc1a6',
      user_id: 1,
      item_id: 2,
      quote:
        'There were programs here that had been written five thousand years ago, before Humankind ever left Earth',
      patch: 'patch3',
      version: 1,
      status: 0, // deleted
      updated_at: now,
      created_at: now,
    },
  ],
  list: [
    { item_id: 1, user_id: 1, time_updated: now, api_id_updated: 0 },
    { item_id: 2, user_id: 1, time_updated: now, api_id_updated: 0 },
    { item_id: 3, user_id: 1, time_updated: now, api_id_updated: 0 }, // no highlights
  ],
});

import { BrazeCollections } from './types';
import { getResizedImageUrl } from '../utils';

export const graphCollectionFixture = {
  data: {
    getCollectionBySlug: {
      externalId: '75898157-b267-49f8-923a-7296ec44b9fe',
      title: 'How Pop Culture Explains The World',
      excerpt:
        'Breaking down the complexities of society with help from Michael Scott, Homer Simpson, and Neopets. ',
      imageUrl:
        'https://s3.amazonaws.com/pocket-collectionapi-prod-images/aef6a1a8-3f6c-4281-b7fc-440e4a3ff8bc.jpeg',
      intro: 'test introduction that has a lot of words',
      publishedAt: '2022-08-03T16:54:22.000Z',
      stories: [
        {
          externalId: '0bc6487f-adad-4971-934b-85bae9852fbd',
          title: 'Labor Exploitation, Explained by Minions',
          url: 'https://www.vox.com/the-goods/23177505/minions-2-rise-of-gru-explained-capitalism',
          excerpt:
            '**Lucy Blakiston**: “Even though I’m not a fan of Minions (this may be an unpopular opinion)',
          imageUrl:
            'https://s3.amazonaws.com/pocket-collectionapi-prod-images/92631502-7403-4900-9bd6-6eb86398fdb9.jpeg',
          publisher: 'Vox',
          authors: [
            {
              name: 'test author-1',
            },
            {
              name: 'test author-2',
            },
          ],
        },
        {
          externalId: '994b8b75-6730-4758-b926-e05d5eea9867',
          title: 'The Rise and Fall of the Pop Star Purity Ring',
          url: 'https://jezebel.com/the-rise-and-fall-of-the-pop-star-purity-ring-1822170318',
          excerpt: 'this is a text with lot of words. and interesting story',
          imageUrl:
            'https://s3.amazonaws.com/pocket-collectionapi-prod-images/609a0ffd-d9af-4cda-b911-9e40397611bc.jpeg',
          publisher: 'Jezebel',
          authors: [
            {
              name: 'Chelsea Beck',
            },
          ],
        },
      ],
    },
  },
};

export const brazeCollectionsFixture: BrazeCollections = Object.freeze({
  ...graphCollectionFixture.data.getCollectionBySlug,
  imageUrl: getResizedImageUrl(
    graphCollectionFixture.data.getCollectionBySlug.imageUrl,
  ),
  stories: graphCollectionFixture.data.getCollectionBySlug.stories.map(
    (story) => {
      const res = {
        ...story,
        //this method is unit tested, so using it in fixture
        imageUrl: getResizedImageUrl(story.imageUrl),
        shortUrl: story.url,
        authors: story.authors.map((author) => author.name),
      };
      return res;
    },
  ),
});

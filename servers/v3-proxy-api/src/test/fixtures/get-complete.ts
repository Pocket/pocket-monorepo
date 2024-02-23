import {
  Imageness,
  SavedItemStatus,
  VideoType,
  Videoness,
} from '../../generated/graphql/types';

export const mockGraphGetComplete = {
  user: {
    savedItemsByOffset: {
      // A response with all optional 'complete' fields
      // authors, videos, tags, images, domain metadata
      entries: [
        {
          id: '11231399273',
          status: SavedItemStatus.Unread,
          url: 'https://www.scientificamerican.com/article/brains-are-not-required-when-it-comes-to-thinking-and-solving-problems-simple-cells-can-do-it/',
          isFavorite: false,
          isArchived: false,
          _updatedAt: 1706300602,
          _createdAt: 1706300602,
          favoritedAt: null,
          archivedAt: null,
          item: {
            __typename: 'Item' as const,
            itemId: '11231399273',
            resolvedId: '11231399273',
            wordCount: 4410,
            topImage: {
              url: 'https://static.scientificamerican.com/sciam/cache/file/0B155646-0D3C-4284-A0AB8EE80631BBA1_source.jpg?w=1200',
            },
            title:
              'Brains Are Not Required When It Comes to Thinking and Solving Problems—Simple Cells Can Do It',
            timeToRead: 20,
            resolvedUrl:
              'https://www.scientificamerican.com/article/brains-are-not-required-when-it-comes-to-thinking-and-solving-problems-simple-cells-can-do-it/',
            givenUrl:
              'https://www.scientificamerican.com/article/brains-are-not-required-when-it-comes-to-thinking-and-solving-problems-simple-cells-can-do-it/',
            excerpt:
              "The planarian is nobody's idea of a genius. A flatworm shaped like a comma, it can be found wriggling through the muck of lakes and ponds worldwide. Its pin-size head has a microscopic structure that passes for a brain.",
            domain: null,
            isArticle: true,
            isIndex: false,
            hasVideo: Videoness.HasVideos,
            hasImage: Imageness.HasImages,
            language: 'en',
            authors: [
              {
                id: '49293842',
                name: 'Rowan Jacobsen',
                url: 'https://www.scientificamerican.com/author/rowan-jacobsen/',
              },
            ],
            images: [
              {
                imageId: 1,
                url: 'https://static.scientificamerican.com/sciam/cache/file/0B155646-0D3C-4284-A0AB8EE80631BBA1_source.jpg?w=600',
                height: 0,
                width: 0,
                credit: 'Natalya Balnova',
                caption: '',
              },
              {
                imageId: 2,
                url: 'https://static.scientificamerican.com/sciam/assets/Image/2023/saw0224Jaco31_d.jpg?w=2000&disable=upscale',
                height: 0,
                width: 0,
                credit:
                  'Brown Bird Design; Source: “A Scalable Pipeline for Designing Reconfigurable Organisms,”  Sam Kriegman et al., in PNAS, Vol. 117; January 2020 (reference)',
                caption: '',
              },
              {
                imageId: 3,
                url: 'https://static.scientificamerican.com/sciam/cache/file/D08F1B3D-F9CE-4076-BF68B82EB51BC674_medium.jpg?w=1536',
                height: 1097,
                width: 1536,
                credit: '',
                caption: '',
              },
            ],
            videos: [
              {
                videoId: 1,
                src: 'https://www.youtube.com/embed/8WyWFAS96ac?si=jETTvE853eizqsVl',
                width: 560,
                type: VideoType.Youtube,
                vid: '8WyWFAS96ac',
                length: 0,
                height: 315,
              },
            ],
            domainMetadata: {
              logo: 'https://logo.clearbit.com/scientificamerican.com?size=800',
              logoGreyscale:
                'https://logo.clearbit.com/scientificamerican.com?size=800&greyscale=true',
              name: 'Scientific American',
            },
          },
          tags: [{ name: 'science' }, { name: 'research' }],
        },
        {
          // A response without optional 'complete' fields
          // authors, videos, tags, images; partial domain metadata only
          id: '2344395952',
          status: SavedItemStatus.Unread,
          url: 'https://saf.apollographql.com/',
          isFavorite: false,
          isArchived: false,
          _updatedAt: 1706732550,
          _createdAt: 1706732546,
          favoritedAt: null,
          archivedAt: null,
          item: {
            __typename: 'Item' as const,
            itemId: '2344395952',
            resolvedId: '2344395952',
            wordCount: 46,
            topImage: null,
            title: 'Supergraph Architecture Framework',
            timeToRead: 20,
            resolvedUrl: 'https://saf.apollographql.com/',
            givenUrl: 'https://saf.apollographql.com/',
            excerpt:
              "The Supergraph Architecture Framework (SAF) is a set of best practices for building a reliable, secure, performant, and developer-friendly graph. By answering the questions in the SAF assessment, you will quantify your graph's current state and identify areas for improvement.",
            domain: null,
            isArticle: false,
            isIndex: true,
            hasVideo: Videoness.NoVideos,
            hasImage: Imageness.NoImages,
            language: 'en',
            authors: [],
            images: null,
            videos: null,
            domainMetadata: {
              name: 'saf.apollographql.com',
            },
          },
        },
      ],
    },
  },
};

export const expectedGetComplete = {
  // TODO: Update additional top-level fields when implemented
  cacheType: 'db',
  list: {
    '11231399273': {
      item_id: '11231399273',
      resolved_id: '11231399273',
      given_url:
        'https://www.scientificamerican.com/article/brains-are-not-required-when-it-comes-to-thinking-and-solving-problems-simple-cells-can-do-it/',
      given_title:
        'Brains Are Not Required When It Comes to Thinking and Solving Problems—Simple Cells Can Do It',
      favorite: '0',
      status: '0',
      time_added: '1706300602',
      time_updated: '1706300602',
      time_read: '0',
      time_favorited: '0',
      sort_id: 0,
      resolved_title:
        'Brains Are Not Required When It Comes to Thinking and Solving Problems—Simple Cells Can Do It',
      resolved_url:
        'https://www.scientificamerican.com/article/brains-are-not-required-when-it-comes-to-thinking-and-solving-problems-simple-cells-can-do-it/',
      excerpt:
        "The planarian is nobody's idea of a genius. A flatworm shaped like a comma, it can be found wriggling through the muck of lakes and ponds worldwide. Its pin-size head has a microscopic structure that passes for a brain.",
      is_article: '1',
      is_index: '0',
      has_video: '1',
      has_image: '1',
      word_count: '4410',
      lang: 'en',
      time_to_read: 20,
      top_image_url:
        'https://static.scientificamerican.com/sciam/cache/file/0B155646-0D3C-4284-A0AB8EE80631BBA1_source.jpg?w=1200',
      authors: {
        '49293842': {
          item_id: '11231399273',
          author_id: '49293842',
          name: 'Rowan Jacobsen',
          url: 'https://www.scientificamerican.com/author/rowan-jacobsen/',
        },
      },
      image: {
        item_id: '11231399273',
        src: 'https://static.scientificamerican.com/sciam/cache/file/0B155646-0D3C-4284-A0AB8EE80631BBA1_source.jpg?w=600',
        width: '0',
        height: '0',
      },
      images: {
        '1': {
          item_id: '11231399273',
          image_id: '1',
          src: 'https://static.scientificamerican.com/sciam/cache/file/0B155646-0D3C-4284-A0AB8EE80631BBA1_source.jpg?w=600',
          width: '0',
          height: '0',
          credit: 'Natalya Balnova',
          caption: '',
        },
        '2': {
          item_id: '11231399273',
          image_id: '2',
          src: 'https://static.scientificamerican.com/sciam/assets/Image/2023/saw0224Jaco31_d.jpg?w=2000&disable=upscale',
          width: '0',
          height: '0',
          credit:
            'Brown Bird Design; Source: “A Scalable Pipeline for Designing Reconfigurable Organisms,”  Sam Kriegman et al., in PNAS, Vol. 117; January 2020 (reference)',
          caption: '',
        },
        '3': {
          item_id: '11231399273',
          image_id: '3',
          src: 'https://static.scientificamerican.com/sciam/cache/file/D08F1B3D-F9CE-4076-BF68B82EB51BC674_medium.jpg?w=1536',
          width: '1536',
          height: '1097',
          credit: '',
          caption: '',
        },
      },
      videos: {
        '1': {
          item_id: '11231399273',
          video_id: '1',
          src: 'https://www.youtube.com/embed/8WyWFAS96ac?si=jETTvE853eizqsVl',
          width: '560',
          height: '315',
          type: '1',
          vid: '8WyWFAS96ac',
          length: '0',
        },
      },
      domain_metadata: {
        name: 'Scientific American',
        logo: 'https://logo.clearbit.com/scientificamerican.com?size=800',
        greyscale_logo:
          'https://logo.clearbit.com/scientificamerican.com?size=800&greyscale=true',
      },
      tags: {
        research: {
          item_id: '11231399273',
          tag: 'research',
        },
        science: {
          item_id: '11231399273',
          tag: 'science',
        },
      },
      // TODO: POCKET-9657
      listen_duration_estimate: 0,
    },
    // Example without 'complete' fields (except a partial domain metadata)
    '2344395952': {
      item_id: '2344395952',
      resolved_id: '2344395952',
      given_url: 'https://saf.apollographql.com/',
      given_title: 'Supergraph Architecture Framework',
      favorite: '0',
      status: '0',
      time_added: '1706732546',
      time_updated: '1706732550',
      time_to_read: 20,
      time_read: '0',
      time_favorited: '0',
      sort_id: 1,
      resolved_title: 'Supergraph Architecture Framework',
      resolved_url: 'https://saf.apollographql.com/',
      excerpt:
        "The Supergraph Architecture Framework (SAF) is a set of best practices for building a reliable, secure, performant, and developer-friendly graph. By answering the questions in the SAF assessment, you will quantify your graph's current state and identify areas for improvement.",
      is_article: '0',
      is_index: '1',
      has_video: '0',
      has_image: '0',
      word_count: '46',
      lang: 'en',
      domain_metadata: {
        name: 'saf.apollographql.com',
      },
      // TODO: POCKET-9657
      listen_duration_estimate: 0,
    },
  },
};

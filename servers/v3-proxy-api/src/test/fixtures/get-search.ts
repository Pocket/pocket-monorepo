import {
  Imageness,
  SavedItemStatus,
  SearchSavedItemsCompleteQuery,
  SearchSavedItemsSimpleQuery,
  VideoType,
  Videoness,
} from '../../generated/graphql/types';
import {
  GetSearchResponseComplete,
  GetSearchResponseSimple,
} from '../../graph/types';

export const expectedFreeTierResponseSimple: GetSearchResponseSimple = {
  list: {
    '282381128': {
      item_id: '282381128',
      resolved_id: '282381128',
      given_url: 'https://isithalloween.com/',
      given_title: 'No.',
      favorite: '0',
      status: '0',
      time_added: '1709662320',
      time_updated: '1709662321',
      time_read: '0',
      time_favorited: '0',
      sort_id: 0,
      resolved_title: 'No.',
      resolved_url: 'http://isithalloween.com',
      excerpt: 'No. Go about your business.',
      is_article: '0',
      is_index: '1',
      has_video: '0',
      has_image: '0',
      word_count: '5',
      lang: '',
      listen_duration_estimate: 2,
      // Technically this is not returned by the v3/get API with search, but
      // I don't see a reason not to set it to the default value
      // that is returned by v3/get without the search term, if it
      // does not exist...
      time_to_read: 0,
      // Also not technically returned by the /v3/get API with search, but
      // in order to exclude it we'd have to conditionally change the response
      // depending whether it was a 'free' or 'premium' search, and since it's
      // additive I don't see an issue...
      highlights: null,
    },
    '3833727237': {
      item_id: '3833727237',
      resolved_id: '3833727237',
      given_url: 'https://isithalloweenyet.com/',
      given_title: '',
      favorite: '0',
      status: '0',
      time_added: '1709593515',
      time_updated: '1709593515',
      time_read: '0',
      time_favorited: '0',
      sort_id: 1,
      resolved_title: '',
      resolved_url: 'https://www.isithalloweenyet.com/',
      excerpt: '',
      is_article: '0',
      is_index: '0',
      has_video: '0',
      has_image: '0',
      word_count: '0',
      lang: '',
      listen_duration_estimate: 0,
      time_to_read: 0,
      highlights: null,
    },
  },
  search_meta: {
    total_result_count: 2,
    offset: 0,
    count: 30,
    has_more: false,
  },
  complete: 1,
  status: 1,
  error: null,
  since: 1709662321,
  maxActions: 30,
  cachetype: 'db',
};
export const expectedFreeTierResponseComplete: GetSearchResponseComplete = {
  complete: 1,
  status: 1,
  error: null,
  since: 1709662321,
  maxActions: 30,
  cachetype: 'db',
  list: {
    '282381128': {
      item_id: '282381128',
      resolved_id: '282381128',
      given_url: 'https://isithalloween.com/',
      given_title: 'No.',
      favorite: '0',
      status: '0',
      time_added: '1709662320',
      time_updated: '1709662321',
      time_read: '0',
      time_favorited: '0',
      sort_id: 0,
      resolved_title: 'No.',
      resolved_url: 'http://isithalloween.com',
      excerpt: 'No. Go about your business.',
      is_article: '0',
      is_index: '1',
      has_video: '0',
      has_image: '0',
      word_count: '5',
      lang: '',
      authors: {
        '1992929': {
          item_id: '282381128',
          author_id: '1992929',
          name: 'Satan',
          url: '',
        },
      },
      domain_metadata: {
        name: 'isithalloween.com',
      },
      listen_duration_estimate: 2,
      time_to_read: 0,
      highlights: null,
    },
    '3833727237': {
      item_id: '3833727237',
      resolved_id: '3833727237',
      given_url: 'https://isithalloweenyet.com/',
      given_title: '',
      favorite: '0',
      status: '0',
      time_added: '1709593515',
      time_updated: '1709593515',
      time_read: '0',
      time_favorited: '0',
      sort_id: 1,
      resolved_title: '',
      resolved_url: 'https://www.isithalloweenyet.com/',
      excerpt: '',
      is_article: '0',
      is_index: '0',
      has_video: '0',
      has_image: '0',
      word_count: '0',
      lang: '',
      tags: {
        test: {
          item_id: '3833727237',
          tag: 'test',
        },
        testing: {
          item_id: '3833727237',
          tag: 'testing',
        },
      },
      domain_metadata: {
        name: 'isithalloweenyet.com',
      },
      time_to_read: 0,
      listen_duration_estimate: 0,
      highlights: null,
    },
  },
  search_meta: {
    offset: 0,
    count: 30,
    total_result_count: 2,
    has_more: false,
  },
};

export const expectedFreeTierSearchNoResults: GetSearchResponseSimple = {
  complete: 1,
  status: 2,
  error: null,
  since: 0,
  maxActions: 30,
  cachetype: 'db',
  list: [],
  search_meta: {
    offset: 0,
    count: 30,
    total_result_count: 0,
    has_more: false,
  },
};

export const graphSearchNoResults = {
  user: {
    searchSavedItemsByOffset: {
      entries: [],
      offset: 0,
      limit: 30,
      totalCount: 0,
    },
  },
};

export const freeTierSearchGraphSimple = {
  user: {
    searchSavedItemsByOffset: {
      entries: [
        {
          savedItem: {
            id: '282381128',
            status: SavedItemStatus.Unread,
            url: 'https://isithalloween.com/',
            isFavorite: false,
            isArchived: false,
            _updatedAt: 1709662321,
            _createdAt: 1709662320,
            favoritedAt: null,
            archivedAt: null,
            item: {
              __typename: 'Item' as const,
              itemId: '282381128',
              resolvedId: '282381128',
              wordCount: 5,
              listenDuration: 2,
              topImage: null,
              title: 'No.',
              timeToRead: null,
              resolvedUrl: 'http://isithalloween.com',
              givenUrl: 'https://isithalloween.com/',
              excerpt: 'No. Go about your business.',
              domain: null,
              isArticle: false,
              isIndex: true,
              hasVideo: Videoness.NoVideos,
              hasImage: Imageness.NoImages,
              language: '',
            },
          },
          searchHighlights: null,
        },
        {
          savedItem: {
            id: '3833727237',
            status: SavedItemStatus.Unread,
            url: 'https://isithalloweenyet.com/',
            isFavorite: false,
            isArchived: false,
            _updatedAt: 1709593515,
            _createdAt: 1709593515,
            favoritedAt: null,
            archivedAt: null,
            item: {
              __typename: 'Item' as const,
              itemId: '3833727237',
              resolvedId: '3833727237',
              wordCount: 0,
              listenDuration: 0,
              topImage: null,
              title: '',
              timeToRead: null,
              resolvedUrl: 'https://www.isithalloweenyet.com/',
              givenUrl: 'https://isithalloweenyet.com/',
              excerpt: '',
              domain: null,
              isArticle: false,
              isIndex: false,
              hasVideo: Videoness.NoVideos,
              hasImage: Imageness.NoImages,
              language: '',
            },
          },
          searchHighlights: null,
        },
      ],
      offset: 0,
      limit: 30,
      totalCount: 2,
    },
  },
};

export const freeTierSearchGraphComplete = {
  user: {
    searchSavedItemsByOffset: {
      entries: [
        {
          savedItem: {
            id: '282381128',
            status: SavedItemStatus.Unread,
            url: 'https://isithalloween.com/',
            isFavorite: false,
            isArchived: false,
            _updatedAt: 1709662321,
            _createdAt: 1709662320,
            favoritedAt: null,
            archivedAt: null,
            item: {
              __typename: 'Item' as const,
              itemId: '282381128',
              resolvedId: '282381128',
              wordCount: 5,
              listenDuration: 2,
              topImage: null,
              title: 'No.',
              timeToRead: null,
              resolvedUrl: 'http://isithalloween.com',
              givenUrl: 'https://isithalloween.com/',
              excerpt: 'No. Go about your business.',
              domain: null,
              isArticle: false,
              isIndex: true,
              hasVideo: Videoness.NoVideos,
              hasImage: Imageness.NoImages,
              language: '',
              authors: [
                {
                  id: '1992929',
                  name: 'Satan',
                  url: '',
                },
              ],
              images: null,
              videos: null,
              domainMetadata: {
                logo: null,
                logoGreyscale: null,
                name: 'isithalloween.com',
              },
            },
          },
          searchHighlights: null,
        },
        {
          savedItem: {
            id: '3833727237',
            status: SavedItemStatus.Unread,
            url: 'https://isithalloweenyet.com/',
            isFavorite: false,
            isArchived: false,
            _updatedAt: 1709593515,
            _createdAt: 1709593515,
            favoritedAt: null,
            archivedAt: null,
            item: {
              __typename: 'Item' as const,
              itemId: '3833727237',
              resolvedId: '3833727237',
              wordCount: 0,
              listenDuration: 0,
              topImage: null,
              title: '',
              timeToRead: null,
              resolvedUrl: 'https://www.isithalloweenyet.com/',
              givenUrl: 'https://isithalloweenyet.com/',
              excerpt: '',
              domain: null,
              isArticle: false,
              isIndex: false,
              hasVideo: Videoness.NoVideos,
              hasImage: Imageness.NoImages,
              language: '',
              authors: null,
              images: null,
              videos: null,
              domainMetadata: {
                logo: null,
                logoGreyscale: null,
                name: 'isithalloweenyet.com',
              },
            },
            tags: [
              {
                name: 'testing',
              },
              {
                name: 'test',
              },
            ],
          },
          searchHighlights: null,
        },
      ],
      offset: 0,
      limit: 30,
      totalCount: 2,
    },
  },
};

export const expectedPremiumTierResponseSimple: GetSearchResponseSimple = {
  complete: 1,
  status: 1,
  error: null,
  since: 1659049987,
  maxActions: 30,
  cachetype: 'db',
  list: {
    '3670270497': {
      item_id: '3670270497',
      resolved_id: '3670270497',
      given_url:
        'https://www.musicalwriters.com/writing-a-musical/montages-backstory-memories-and-ticking-clocks/',
      given_title:
        'How Musicals Make the Most of Time: Montage, Backstory, Memories, and Ticking Clocks',
      favorite: '0',
      status: '0',
      time_added: '1659049981',
      time_updated: '1659049987',
      time_read: '0',
      time_favorited: '0',
      sort_id: 1,
      highlights: {
        fullText:
          'The fictional moment set up in the <em>musical</em> is precarious and precious.',
        tags: '<em>musical</em>',
        title:
          'How <em>Musicals</em> Make the Most of Time: Montage, Backstory, Memories, and Ticking Clocks',
        url: 'https://www.musicalwriters.com/writing-a-<em>musical</em>/montages-backstory-memories-and-ticking-clocks/',
      },
      resolved_title:
        'How Musicals Make the Most of Time: Montage, Backstory, Memories, and Ticking Clocks',
      resolved_url:
        'https://www.musicalwriters.com/writing-a-musical/montages-backstory-memories-and-ticking-clocks/',
      excerpt:
        'Two young lovers in the musical Children of Eden face each other in front of Noah’s Ark just before the rain begins—one is scheduled to get on the boat and the other is not. The fictional moment set up in the musical is precarious and precious.',
      is_article: '1',
      is_index: '0',
      has_video: '1',
      has_image: '1',
      word_count: '1843',
      lang: 'en',
      time_to_read: 8,
      top_image_url:
        'https://www.musicalwriters.com/wp-content/uploads/2021/10/Montage-Backstory-Memories-and-Ticking-Clocks.jpg',
      listen_duration_estimate: 713,
    },
    '3457459746': {
      item_id: '3457459746',
      resolved_id: '3457459746',
      given_url:
        'https://www.musicalwriters.com/writing-a-musical/musicals-make-the-most-of-time-stephen-schwartz/',
      given_title:
        'How Musicals Make the Most of Time – A Conversation with Stephen Schwartz',
      favorite: '0',
      status: '0',
      time_added: '1659049971',
      time_updated: '1659049974',
      time_read: '0',
      time_favorited: '0',
      sort_id: 2,
      highlights: {
        fullText:
          'from an Amazon link, we earn a small percentage that helps keep <em>MusicalWriters</em> running.',
        tags: '<em>musical</em>',
        title:
          'How <em>Musicals</em> Make the Most of Time – A Conversation with Stephen Schwartz',
        url: 'https://www.musicalwriters.com/writing-a-<em>musical</em>/<em>musicals</em>-make-the-most-of-time-stephen-schwartz/',
      },
      resolved_title:
        'How Musicals Make the Most of Time – A Conversation with Stephen Schwartz',
      resolved_url:
        'https://www.musicalwriters.com/writing-a-musical/musicals-make-the-most-of-time-stephen-schwartz/',
      excerpt:
        'We enjoy sharing content and resources that we know and love. MusicalWriters.com is an Amazon Associate and earns from qualifying purchases, so if you take action from an Amazon link, we earn a small percentage that helps keep MusicalWriters running.',
      is_article: '1',
      is_index: '0',
      has_video: '1',
      has_image: '1',
      word_count: '2722',
      lang: 'en',
      time_to_read: 12,
      top_image_url:
        'https://www.musicalwriters.com/wp-content/uploads/2021/10/How-Musicals-Make-the-Most-of-Time-part-one.jpg',
      listen_duration_estimate: 1054,
    },
    '3670270094': {
      item_id: '3670270094',
      resolved_id: '3670270094',
      given_url:
        'https://www.musicalwriters.com/writing-a-musical/how-opening-numbers-reveal-a-world-or-launch-the-story/',
      given_title: 'How Opening Numbers Reveal a World or Launch the Story',
      favorite: '0',
      status: '0',
      time_added: '1659049937',
      time_updated: '1659049945',
      time_read: '0',
      time_favorited: '0',
      sort_id: 0,
      highlights: {
        fullText:
          'When <em>musical</em> theatre aficionados list favorite opening numbers, they often include Pippin&rsquo;s &ldquo',
        tags: '<em>musical</em>',
        title: null,
        url: 'https://www.musicalwriters.com/writing-a-<em>musical</em>/how-opening-numbers-reveal-a-world-or-launch-the-story',
      },
      resolved_title: 'How Opening Numbers Reveal a World or Launch the Story',
      resolved_url:
        'https://www.musicalwriters.com/writing-a-musical/how-opening-numbers-reveal-a-world-or-launch-the-story/',
      excerpt:
        'When musical theatre aficionados list favorite opening numbers, they often include Pippin’s “Magic to Do” with its alluring, break-the-fourth-wall invitation into the world of the show.',
      is_article: '1',
      is_index: '0',
      has_video: '1',
      has_image: '1',
      word_count: '2288',
      lang: 'en',
      time_to_read: 10,
      top_image_url:
        'https://www.musicalwriters.com/wp-content/uploads/2022/01/Opening-Numbers-interview-with-Stephen-Schwartz.jpg',
      listen_duration_estimate: 886,
    },
  },
  search_meta: {
    total_result_count: 22,
    count: 3,
    offset: 0,
    has_more: true,
  },
};

export const expectedPremiumTierResponseComplete: GetSearchResponseComplete = {
  complete: 1,
  status: 1,
  error: null,
  since: 1659049987,
  maxActions: 30,
  cachetype: 'db',
  list: {
    '3670270497': {
      item_id: '3670270497',
      resolved_id: '3670270497',
      given_url:
        'https://www.musicalwriters.com/writing-a-musical/montages-backstory-memories-and-ticking-clocks/',
      given_title:
        'How Musicals Make the Most of Time: Montage, Backstory, Memories, and Ticking Clocks',
      favorite: '0',
      status: '0',
      time_added: '1659049981',
      time_updated: '1659049987',
      time_read: '0',
      time_favorited: '0',
      sort_id: 1,
      highlights: {
        fullText:
          'The fictional moment set up in the <em>musical</em> is precarious and precious.',
        tags: '<em>musical</em>',
        title:
          'How <em>Musicals</em> Make the Most of Time: Montage, Backstory, Memories, and Ticking Clocks',
        url: 'https://www.musicalwriters.com/writing-a-<em>musical</em>/montages-backstory-memories-and-ticking-clocks/',
      },
      resolved_title:
        'How Musicals Make the Most of Time: Montage, Backstory, Memories, and Ticking Clocks',
      resolved_url:
        'https://www.musicalwriters.com/writing-a-musical/montages-backstory-memories-and-ticking-clocks/',
      excerpt:
        'Two young lovers in the musical Children of Eden face each other in front of Noah’s Ark just before the rain begins—one is scheduled to get on the boat and the other is not. The fictional moment set up in the musical is precarious and precious.',
      is_article: '1',
      is_index: '0',
      has_video: '1',
      has_image: '1',
      word_count: '1843',
      lang: 'en',
      time_to_read: 8,
      top_image_url:
        'https://www.musicalwriters.com/wp-content/uploads/2021/10/Montage-Backstory-Memories-and-Ticking-Clocks.jpg',
      tags: {
        musical: {
          item_id: '3670270497',
          tag: 'musical',
        },
      },
      authors: {
        '108109059': {
          item_id: '3670270497',
          author_id: '108109059',
          name: 'Carol de Giere',
          url: 'https://www.musicalwriters.com/author/carol-de-giere/',
        },
      },
      domain_metadata: {
        name: 'musicalwriters.com',
      },
      image: {
        item_id: '3670270497',
        src: 'http://img.youtube.com/vi/vo_s6PsVogI/0.jpg',
        width: '480',
        height: '360',
      },
      images: {
        '1': {
          item_id: '3670270497',
          image_id: '1',
          src: 'http://img.youtube.com/vi/vo_s6PsVogI/0.jpg',
          width: '480',
          height: '360',
          credit: '',
          caption: '',
        },
      },
      videos: {
        '1': {
          item_id: '3670270497',
          video_id: '1',
          src: 'https://www.youtube.com/embed/vo_s6PsVogI?feature=oembed',
          width: '1080',
          height: '608',
          type: '1',
          vid: 'vo_s6PsVogI',
          length: '0',
        },
        '2': {
          item_id: '3670270497',
          video_id: '2',
          src: 'https://www.youtube.com/embed/ujsd49oR17g?feature=oembed',
          width: '1080',
          height: '810',
          type: '1',
          vid: 'ujsd49oR17g',
          length: '0',
        },
        '3': {
          item_id: '3670270497',
          video_id: '3',
          src: 'https://www.youtube.com/embed/yL9f_L-s8GQ?feature=oembed',
          width: '1080',
          height: '608',
          type: '1',
          vid: 'yL9f_L-s8GQ',
          length: '0',
        },
        '4': {
          item_id: '3670270497',
          video_id: '4',
          src: 'https://www.youtube.com/embed/UB-NjDicZmI?feature=oembed',
          width: '1080',
          height: '810',
          type: '1',
          vid: 'UB-NjDicZmI',
          length: '0',
        },
      },
      listen_duration_estimate: 713,
    },
    '3457459746': {
      item_id: '3457459746',
      resolved_id: '3457459746',
      given_url:
        'https://www.musicalwriters.com/writing-a-musical/musicals-make-the-most-of-time-stephen-schwartz/',
      given_title:
        'How Musicals Make the Most of Time – A Conversation with Stephen Schwartz',
      favorite: '0',
      status: '0',
      time_added: '1659049971',
      time_updated: '1659049974',
      time_read: '0',
      time_favorited: '0',
      sort_id: 2,
      highlights: {
        fullText:
          'from an Amazon link, we earn a small percentage that helps keep <em>MusicalWriters</em> running.',
        tags: '<em>musical</em>',
        title:
          'How <em>Musicals</em> Make the Most of Time – A Conversation with Stephen Schwartz',
        url: 'https://www.musicalwriters.com/writing-a-<em>musical</em>/<em>musicals</em>-make-the-most-of-time-stephen-schwartz/',
      },
      resolved_title:
        'How Musicals Make the Most of Time – A Conversation with Stephen Schwartz',
      resolved_url:
        'https://www.musicalwriters.com/writing-a-musical/musicals-make-the-most-of-time-stephen-schwartz/',
      excerpt:
        'We enjoy sharing content and resources that we know and love. MusicalWriters.com is an Amazon Associate and earns from qualifying purchases, so if you take action from an Amazon link, we earn a small percentage that helps keep MusicalWriters running.',
      is_article: '1',
      is_index: '0',
      has_video: '1',
      has_image: '1',
      word_count: '2722',
      lang: 'en',
      time_to_read: 12,
      top_image_url:
        'https://www.musicalwriters.com/wp-content/uploads/2021/10/How-Musicals-Make-the-Most-of-Time-part-one.jpg',
      tags: {
        musical: {
          item_id: '3457459746',
          tag: 'musical',
        },
      },
      authors: {
        '108109059': {
          item_id: '3457459746',
          author_id: '108109059',
          name: 'Carol de Giere',
          url: 'https://www.musicalwriters.com/author/carol-de-giere/',
        },
      },
      domain_metadata: {
        name: 'musicalwriters.com',
      },
      image: {
        item_id: '3457459746',
        src: 'http://img.youtube.com/vi/7ls478MwuGc/0.jpg',
        width: '480',
        height: '360',
      },
      images: {
        '1': {
          item_id: '3457459746',
          image_id: '1',
          src: 'http://img.youtube.com/vi/7ls478MwuGc/0.jpg',
          width: '480',
          height: '360',
          credit: '',
          caption: '',
        },
      },
      videos: {
        '1': {
          item_id: '3457459746',
          video_id: '1',
          src: 'https://www.youtube.com/embed/7ls478MwuGc?feature=oembed',
          width: '1080',
          height: '810',
          type: '1',
          vid: '7ls478MwuGc',
          length: '0',
        },
        '2': {
          item_id: '3457459746',
          video_id: '2',
          src: 'https://www.youtube.com/embed/GQxM5rJ-uiY?start=3&feature=oembed',
          width: '1080',
          height: '608',
          type: '1',
          vid: 'GQxM5rJ-uiY',
          length: '0',
        },
      },
      listen_duration_estimate: 1054,
    },
    '3670270094': {
      item_id: '3670270094',
      resolved_id: '3670270094',
      given_url:
        'https://www.musicalwriters.com/writing-a-musical/how-opening-numbers-reveal-a-world-or-launch-the-story/',
      given_title: 'How Opening Numbers Reveal a World or Launch the Story',
      favorite: '0',
      status: '0',
      time_added: '1659049937',
      time_updated: '1659049945',
      time_read: '0',
      time_favorited: '0',
      sort_id: 0,
      highlights: {
        fullText:
          'When <em>musical</em> theatre aficionados list favorite opening numbers, they often include Pippin&rsquo;s &ldquo',
        tags: '<em>musical</em>',
        title: null,
        url: 'https://www.musicalwriters.com/writing-a-<em>musical</em>/how-opening-numbers-reveal-a-world-or-launch-the-story',
      },
      resolved_title: 'How Opening Numbers Reveal a World or Launch the Story',
      resolved_url:
        'https://www.musicalwriters.com/writing-a-musical/how-opening-numbers-reveal-a-world-or-launch-the-story/',
      excerpt:
        'When musical theatre aficionados list favorite opening numbers, they often include Pippin’s “Magic to Do” with its alluring, break-the-fourth-wall invitation into the world of the show.',
      is_article: '1',
      is_index: '0',
      has_video: '1',
      has_image: '1',
      word_count: '2288',
      lang: 'en',
      time_to_read: 10,
      top_image_url:
        'https://www.musicalwriters.com/wp-content/uploads/2022/01/Opening-Numbers-interview-with-Stephen-Schwartz.jpg',
      tags: {
        musical: {
          item_id: '3670270094',
          tag: 'musical',
        },
      },
      authors: {
        '108109059': {
          item_id: '3670270094',
          author_id: '108109059',
          name: 'Carol de Giere',
          url: 'https://www.musicalwriters.com/author/carol-de-giere/',
        },
      },
      domain_metadata: {
        name: 'musicalwriters.com',
      },
      image: {
        item_id: '3670270094',
        src: 'https://www.musicalwriters.com/wp-content/uploads/2022/01/carol-dg-and-stephen-schwartz-20211110-sm.jpg',
        width: '478',
        height: '286',
      },
      images: {
        '1': {
          item_id: '3670270094',
          image_id: '1',
          src: 'https://www.musicalwriters.com/wp-content/uploads/2022/01/carol-dg-and-stephen-schwartz-20211110-sm.jpg',
          width: '478',
          height: '286',
          credit: '',
          caption: '',
        },
      },
      videos: {
        '1': {
          item_id: '3670270094',
          video_id: '1',
          src: 'https://www.youtube.com/embed/RH1gH33z1Y4',
          width: '560',
          height: '315',
          type: '1',
          vid: 'RH1gH33z1Y4',
          length: '0',
        },
        '2': {
          item_id: '3670270094',
          video_id: '2',
          src: 'https://www.youtube.com/embed/EAYUuspQ6BY',
          width: '560',
          height: '315',
          type: '1',
          vid: 'EAYUuspQ6BY',
          length: '0',
        },
        '3': {
          item_id: '3670270094',
          video_id: '3',
          src: 'https://www.youtube.com/embed/VxcT7HImOcg',
          width: '560',
          height: '315',
          type: '1',
          vid: 'VxcT7HImOcg',
          length: '0',
        },
        '4': {
          item_id: '3670270094',
          video_id: '4',
          src: 'https://www.youtube.com/embed/DH_XQcEhOPA',
          width: '560',
          height: '315',
          type: '1',
          vid: 'DH_XQcEhOPA',
          length: '0',
        },
        '5': {
          item_id: '3670270094',
          video_id: '5',
          src: 'https://www.youtube.com/embed/Fw7SsNNjQGQ',
          width: '560',
          height: '315',
          type: '1',
          vid: 'Fw7SsNNjQGQ',
          length: '0',
        },
      },
      listen_duration_estimate: 886,
    },
  },
  search_meta: {
    total_result_count: 22,
    count: 3,
    offset: 0,
    has_more: true,
  },
};

export const premiumSearchGraphComplete: SearchSavedItemsCompleteQuery = {
  user: {
    searchSavedItemsByOffset: {
      entries: [
        {
          savedItem: {
            id: '3670270094',
            status: SavedItemStatus.Unread,
            url: 'https://www.musicalwriters.com/writing-a-musical/how-opening-numbers-reveal-a-world-or-launch-the-story/',
            isFavorite: false,
            isArchived: false,
            _updatedAt: 1659049945,
            _createdAt: 1659049937,
            favoritedAt: null,
            archivedAt: null,
            item: {
              __typename: 'Item' as const,
              itemId: '3670270094',
              resolvedId: '3670270094',
              wordCount: 2288,
              listenDuration: 886,
              topImage: {
                url: 'https://www.musicalwriters.com/wp-content/uploads/2022/01/Opening-Numbers-interview-with-Stephen-Schwartz.jpg',
              },
              title: 'How Opening Numbers Reveal a World or Launch the Story',
              timeToRead: 10,
              resolvedUrl:
                'https://www.musicalwriters.com/writing-a-musical/how-opening-numbers-reveal-a-world-or-launch-the-story/',
              givenUrl:
                'https://www.musicalwriters.com/writing-a-musical/how-opening-numbers-reveal-a-world-or-launch-the-story/',
              excerpt:
                'When musical theatre aficionados list favorite opening numbers, they often include Pippin’s “Magic to Do” with its alluring, break-the-fourth-wall invitation into the world of the show.',
              domain: null,
              isArticle: true,
              isIndex: false,
              hasVideo: Videoness.HasVideos,
              hasImage: Imageness.HasImages,
              language: 'en',
              authors: [
                {
                  id: '108109059',
                  name: 'Carol de Giere',
                  url: 'https://www.musicalwriters.com/author/carol-de-giere/',
                },
              ],
              images: [
                {
                  imageId: 1,
                  url: 'https://www.musicalwriters.com/wp-content/uploads/2022/01/carol-dg-and-stephen-schwartz-20211110-sm.jpg',
                  height: 286,
                  width: 478,
                  credit: '',
                  caption: '',
                },
              ],
              videos: [
                {
                  videoId: 1,
                  src: 'https://www.youtube.com/embed/RH1gH33z1Y4',
                  width: 560,
                  type: VideoType.Youtube,
                  vid: 'RH1gH33z1Y4',
                  length: 0,
                  height: 315,
                },
                {
                  videoId: 2,
                  src: 'https://www.youtube.com/embed/EAYUuspQ6BY',
                  width: 560,
                  type: VideoType.Youtube,
                  vid: 'EAYUuspQ6BY',
                  length: 0,
                  height: 315,
                },
                {
                  videoId: 3,
                  src: 'https://www.youtube.com/embed/VxcT7HImOcg',
                  width: 560,
                  type: VideoType.Youtube,
                  vid: 'VxcT7HImOcg',
                  length: 0,
                  height: 315,
                },
                {
                  videoId: 4,
                  src: 'https://www.youtube.com/embed/DH_XQcEhOPA',
                  width: 560,
                  type: VideoType.Youtube,
                  vid: 'DH_XQcEhOPA',
                  length: 0,
                  height: 315,
                },
                {
                  videoId: 5,
                  src: 'https://www.youtube.com/embed/Fw7SsNNjQGQ',
                  width: 560,
                  type: VideoType.Youtube,
                  vid: 'Fw7SsNNjQGQ',
                  length: 0,
                  height: 315,
                },
              ],
              domainMetadata: {
                logo: null,
                logoGreyscale: null,
                name: 'musicalwriters.com',
              },
            },
            tags: [
              {
                name: 'musical',
              },
            ],
          },
          searchHighlights: {
            fullText: [
              'When <em>musical</em> theatre aficionados list favorite opening numbers, they often include Pippin&rsquo;s &ldquo',
              'Rodgers and Hammerstein <em>musicals</em> tend to start right away.',
              '&ldquo;Deliver Us&rdquo; (for The Prince of Egypt movie and stage <em>musical</em>) is a good example.',
              'What setting, tone, who am I following, <em>musical</em> style?',
              'This eventually drew out some other principles of <em>musical</em> writing.',
            ],
            url: [
              'https://www.musicalwriters.com/writing-a-<em>musical</em>/how-opening-numbers-reveal-a-world-or-launch-the-story',
            ],
            tags: ['<em>musical</em>'],
            title: null,
          },
        },
        {
          savedItem: {
            id: '3670270497',
            status: SavedItemStatus.Unread,
            url: 'https://www.musicalwriters.com/writing-a-musical/montages-backstory-memories-and-ticking-clocks/',
            isFavorite: false,
            isArchived: false,
            _updatedAt: 1659049987,
            _createdAt: 1659049981,
            favoritedAt: null,
            archivedAt: null,
            item: {
              __typename: 'Item' as const,
              itemId: '3670270497',
              resolvedId: '3670270497',
              wordCount: 1843,
              listenDuration: 713,
              topImage: {
                url: 'https://www.musicalwriters.com/wp-content/uploads/2021/10/Montage-Backstory-Memories-and-Ticking-Clocks.jpg',
              },
              title:
                'How Musicals Make the Most of Time: Montage, Backstory, Memories, and Ticking Clocks',
              timeToRead: 8,
              resolvedUrl:
                'https://www.musicalwriters.com/writing-a-musical/montages-backstory-memories-and-ticking-clocks/',
              givenUrl:
                'https://www.musicalwriters.com/writing-a-musical/montages-backstory-memories-and-ticking-clocks/',
              excerpt:
                'Two young lovers in the musical Children of Eden face each other in front of Noah’s Ark just before the rain begins—one is scheduled to get on the boat and the other is not. The fictional moment set up in the musical is precarious and precious.',
              domain: null,
              isArticle: true,
              isIndex: false,
              hasVideo: Videoness.HasVideos,
              hasImage: Imageness.HasImages,
              language: 'en',
              authors: [
                {
                  id: '108109059',
                  name: 'Carol de Giere',
                  url: 'https://www.musicalwriters.com/author/carol-de-giere/',
                },
              ],
              images: [
                {
                  imageId: 1,
                  url: 'http://img.youtube.com/vi/vo_s6PsVogI/0.jpg',
                  height: 360,
                  width: 480,
                  credit: '',
                  caption: '',
                },
              ],
              videos: [
                {
                  videoId: 1,
                  src: 'https://www.youtube.com/embed/vo_s6PsVogI?feature=oembed',
                  width: 1080,
                  type: VideoType.Youtube,
                  vid: 'vo_s6PsVogI',
                  length: 0,
                  height: 608,
                },
                {
                  videoId: 2,
                  src: 'https://www.youtube.com/embed/ujsd49oR17g?feature=oembed',
                  width: 1080,
                  type: VideoType.Youtube,
                  vid: 'ujsd49oR17g',
                  length: 0,
                  height: 810,
                },
                {
                  videoId: 3,
                  src: 'https://www.youtube.com/embed/yL9f_L-s8GQ?feature=oembed',
                  width: 1080,
                  type: VideoType.Youtube,
                  vid: 'yL9f_L-s8GQ',
                  length: 0,
                  height: 608,
                },
                {
                  videoId: 4,
                  src: 'https://www.youtube.com/embed/UB-NjDicZmI?feature=oembed',
                  width: 1080,
                  type: VideoType.Youtube,
                  vid: 'UB-NjDicZmI',
                  length: 0,
                  height: 810,
                },
              ],
              domainMetadata: {
                logo: null,
                logoGreyscale: null,
                name: 'musicalwriters.com',
              },
            },
            tags: [
              {
                name: 'musical',
              },
            ],
          },
          searchHighlights: {
            fullText: [
              'The fictional moment set up in the <em>musical</em> is precarious and precious.',
              'Other <em>musicals</em> zip through time by using &ldquo;montages&rdquo; or &ldquo;<em>musical</em> sequences&rdquo;&mdash',
              ';<em>musical</em> numbers that span plot points.',
              'The 1996 <em>musical</em> Evita includes several montage examples.',
              'In Hal Prince&rsquo;s original production, it was done as a game of <em>musical</em> chairs.',
            ],
            url: [
              'https://www.musicalwriters.com/writing-a-<em>musical</em>/montages-backstory-memories-and-ticking-clocks/',
            ],
            tags: ['<em>musical</em>'],
            title: [
              'How <em>Musicals</em> Make the Most of Time: Montage, Backstory, Memories, and Ticking Clocks',
            ],
          },
        },
        {
          savedItem: {
            id: '3457459746',
            status: SavedItemStatus.Unread,
            url: 'https://www.musicalwriters.com/writing-a-musical/musicals-make-the-most-of-time-stephen-schwartz/',
            isFavorite: false,
            isArchived: false,
            _updatedAt: 1659049974,
            _createdAt: 1659049971,
            favoritedAt: null,
            archivedAt: null,
            item: {
              __typename: 'Item' as const,
              itemId: '3457459746',
              resolvedId: '3457459746',
              wordCount: 2722,
              listenDuration: 1054,
              topImage: {
                url: 'https://www.musicalwriters.com/wp-content/uploads/2021/10/How-Musicals-Make-the-Most-of-Time-part-one.jpg',
              },
              title:
                'How Musicals Make the Most of Time – A Conversation with Stephen Schwartz',
              timeToRead: 12,
              resolvedUrl:
                'https://www.musicalwriters.com/writing-a-musical/musicals-make-the-most-of-time-stephen-schwartz/',
              givenUrl:
                'https://www.musicalwriters.com/writing-a-musical/musicals-make-the-most-of-time-stephen-schwartz/',
              excerpt:
                'We enjoy sharing content and resources that we know and love. MusicalWriters.com is an Amazon Associate and earns from qualifying purchases, so if you take action from an Amazon link, we earn a small percentage that helps keep MusicalWriters running.',
              domain: null,
              isArticle: true,
              isIndex: false,
              hasVideo: Videoness.HasVideos,
              hasImage: Imageness.HasImages,
              language: 'en',
              authors: [
                {
                  id: '108109059',
                  name: 'Carol de Giere',
                  url: 'https://www.musicalwriters.com/author/carol-de-giere/',
                },
              ],
              images: [
                {
                  imageId: 1,
                  url: 'http://img.youtube.com/vi/7ls478MwuGc/0.jpg',
                  height: 360,
                  width: 480,
                  credit: '',
                  caption: '',
                },
              ],
              videos: [
                {
                  videoId: 1,
                  src: 'https://www.youtube.com/embed/7ls478MwuGc?feature=oembed',
                  width: 1080,
                  type: VideoType.Youtube,
                  vid: '7ls478MwuGc',
                  length: 0,
                  height: 810,
                },
                {
                  videoId: 2,
                  src: 'https://www.youtube.com/embed/GQxM5rJ-uiY?start=3&feature=oembed',
                  width: 1080,
                  type: VideoType.Youtube,
                  vid: 'GQxM5rJ-uiY',
                  length: 0,
                  height: 608,
                },
              ],
              domainMetadata: {
                logo: null,
                logoGreyscale: null,
                name: 'musicalwriters.com',
              },
            },
            tags: [
              {
                name: 'musical',
              },
            ],
          },
          searchHighlights: {
            fullText: [
              'from an Amazon link, we earn a small percentage that helps keep <em>MusicalWriters</em> running.',
              'CD: It seems to me that time is a big part of <em>musical</em> writing.',
              'But <em>musicals</em> also have characters stopping to sing a song, and that expands time.',
              'Do <em>musical</em> writers keep montages in mind?',
              'What makes it work is that the <em>musicalization</em> makes it feel like all one song.',
            ],
            url: [
              'https://www.musicalwriters.com/writing-a-<em>musical</em>/<em>musicals</em>-make-the-most-of-time-stephen-schwartz/',
            ],
            tags: ['<em>musical</em>'],
            title: [
              'How <em>Musicals</em> Make the Most of Time – A Conversation with Stephen Schwartz',
            ],
          },
        },
      ],
      offset: 0,
      limit: 3,
      totalCount: 22,
    },
  },
};

export const premiumSearchGraphSimple: SearchSavedItemsSimpleQuery = {
  user: {
    searchSavedItemsByOffset: {
      entries: [
        {
          savedItem: {
            id: '3670270094',
            status: SavedItemStatus.Unread,
            url: 'https://www.musicalwriters.com/writing-a-musical/how-opening-numbers-reveal-a-world-or-launch-the-story/',
            isFavorite: false,
            isArchived: false,
            _updatedAt: 1659049945,
            _createdAt: 1659049937,
            favoritedAt: null,
            archivedAt: null,
            item: {
              __typename: 'Item' as const,
              itemId: '3670270094',
              resolvedId: '3670270094',
              wordCount: 2288,
              listenDuration: 886,
              topImage: {
                url: 'https://www.musicalwriters.com/wp-content/uploads/2022/01/Opening-Numbers-interview-with-Stephen-Schwartz.jpg',
              },
              title: 'How Opening Numbers Reveal a World or Launch the Story',
              timeToRead: 10,
              resolvedUrl:
                'https://www.musicalwriters.com/writing-a-musical/how-opening-numbers-reveal-a-world-or-launch-the-story/',
              givenUrl:
                'https://www.musicalwriters.com/writing-a-musical/how-opening-numbers-reveal-a-world-or-launch-the-story/',
              excerpt:
                'When musical theatre aficionados list favorite opening numbers, they often include Pippin’s “Magic to Do” with its alluring, break-the-fourth-wall invitation into the world of the show.',
              domain: null,
              isArticle: true,
              isIndex: false,
              hasVideo: Videoness.HasVideos,
              hasImage: Imageness.HasImages,
              language: 'en',
            },
          },
          searchHighlights: {
            fullText: [
              'When <em>musical</em> theatre aficionados list favorite opening numbers, they often include Pippin&rsquo;s &ldquo',
              'Rodgers and Hammerstein <em>musicals</em> tend to start right away.',
              '&ldquo;Deliver Us&rdquo; (for The Prince of Egypt movie and stage <em>musical</em>) is a good example.',
              'What setting, tone, who am I following, <em>musical</em> style?',
              'This eventually drew out some other principles of <em>musical</em> writing.',
            ],
            url: [
              'https://www.musicalwriters.com/writing-a-<em>musical</em>/how-opening-numbers-reveal-a-world-or-launch-the-story',
            ],
            tags: ['<em>musical</em>'],
            title: null,
          },
        },
        {
          savedItem: {
            id: '3670270497',
            status: SavedItemStatus.Unread,
            url: 'https://www.musicalwriters.com/writing-a-musical/montages-backstory-memories-and-ticking-clocks/',
            isFavorite: false,
            isArchived: false,
            _updatedAt: 1659049987,
            _createdAt: 1659049981,
            favoritedAt: null,
            archivedAt: null,
            item: {
              __typename: 'Item' as const,
              itemId: '3670270497',
              resolvedId: '3670270497',
              wordCount: 1843,
              listenDuration: 713,
              topImage: {
                url: 'https://www.musicalwriters.com/wp-content/uploads/2021/10/Montage-Backstory-Memories-and-Ticking-Clocks.jpg',
              },
              title:
                'How Musicals Make the Most of Time: Montage, Backstory, Memories, and Ticking Clocks',
              timeToRead: 8,
              resolvedUrl:
                'https://www.musicalwriters.com/writing-a-musical/montages-backstory-memories-and-ticking-clocks/',
              givenUrl:
                'https://www.musicalwriters.com/writing-a-musical/montages-backstory-memories-and-ticking-clocks/',
              excerpt:
                'Two young lovers in the musical Children of Eden face each other in front of Noah’s Ark just before the rain begins—one is scheduled to get on the boat and the other is not. The fictional moment set up in the musical is precarious and precious.',
              domain: null,
              isArticle: true,
              isIndex: false,
              hasVideo: Videoness.HasVideos,
              hasImage: Imageness.HasImages,
              language: 'en',
            },
          },
          searchHighlights: {
            fullText: [
              'The fictional moment set up in the <em>musical</em> is precarious and precious.',
              'Other <em>musicals</em> zip through time by using &ldquo;montages&rdquo; or &ldquo;<em>musical</em> sequences&rdquo;&mdash',
              ';<em>musical</em> numbers that span plot points.',
              'The 1996 <em>musical</em> Evita includes several montage examples.',
              'In Hal Prince&rsquo;s original production, it was done as a game of <em>musical</em> chairs.',
            ],
            url: [
              'https://www.musicalwriters.com/writing-a-<em>musical</em>/montages-backstory-memories-and-ticking-clocks/',
            ],
            tags: ['<em>musical</em>'],
            title: [
              'How <em>Musicals</em> Make the Most of Time: Montage, Backstory, Memories, and Ticking Clocks',
            ],
          },
        },
        {
          savedItem: {
            id: '3457459746',
            status: SavedItemStatus.Unread,
            url: 'https://www.musicalwriters.com/writing-a-musical/musicals-make-the-most-of-time-stephen-schwartz/',
            isFavorite: false,
            isArchived: false,
            _updatedAt: 1659049974,
            _createdAt: 1659049971,
            favoritedAt: null,
            archivedAt: null,
            item: {
              __typename: 'Item' as const,
              itemId: '3457459746',
              resolvedId: '3457459746',
              wordCount: 2722,
              listenDuration: 1054,
              topImage: {
                url: 'https://www.musicalwriters.com/wp-content/uploads/2021/10/How-Musicals-Make-the-Most-of-Time-part-one.jpg',
              },
              title:
                'How Musicals Make the Most of Time – A Conversation with Stephen Schwartz',
              timeToRead: 12,
              resolvedUrl:
                'https://www.musicalwriters.com/writing-a-musical/musicals-make-the-most-of-time-stephen-schwartz/',
              givenUrl:
                'https://www.musicalwriters.com/writing-a-musical/musicals-make-the-most-of-time-stephen-schwartz/',
              excerpt:
                'We enjoy sharing content and resources that we know and love. MusicalWriters.com is an Amazon Associate and earns from qualifying purchases, so if you take action from an Amazon link, we earn a small percentage that helps keep MusicalWriters running.',
              domain: null,
              isArticle: true,
              isIndex: false,
              hasVideo: Videoness.HasVideos,
              hasImage: Imageness.HasImages,
              language: 'en',
            },
          },
          searchHighlights: {
            fullText: [
              'from an Amazon link, we earn a small percentage that helps keep <em>MusicalWriters</em> running.',
              'CD: It seems to me that time is a big part of <em>musical</em> writing.',
              'But <em>musicals</em> also have characters stopping to sing a song, and that expands time.',
              'Do <em>musical</em> writers keep montages in mind?',
              'What makes it work is that the <em>musicalization</em> makes it feel like all one song.',
            ],
            url: [
              'https://www.musicalwriters.com/writing-a-<em>musical</em>/<em>musicals</em>-make-the-most-of-time-stephen-schwartz/',
            ],
            tags: ['<em>musical</em>'],
            title: [
              'How <em>Musicals</em> Make the Most of Time – A Conversation with Stephen Schwartz',
            ],
          },
        },
      ],
      offset: 0,
      limit: 3,
      totalCount: 22,
    },
  },
};

export const premiumSearchGraphSimpleAnnotations: SearchSavedItemsSimpleQuery =
  addAnnotations(premiumSearchGraphSimple, 2);
export const premiumSearchGraphCompleteAnnotations: SearchSavedItemsCompleteQuery =
  addAnnotations(premiumSearchGraphComplete, 2);
export const freeTierSearchGraphSimpleAnnotations: SearchSavedItemsSimpleQuery =
  addAnnotations(freeTierSearchGraphSimple, 0);
export const freeTierSearchGraphCompleteAnnotations: SearchSavedItemsCompleteQuery =
  addAnnotations(freeTierSearchGraphComplete, 0);

const expectedAnnotations = (itemId: string) => ({
  annotations: [
    {
      annotation_id: 'd4d4fcef-bce1-4676-b291-f8678d08d234',
      item_id: itemId,
      quote:
        'Creators of any type of fiction are often advised to include some kind of metaphorical “ticking clock” in their stories— a plot device that puts a time limit on when the protagonist(s) must complete a task or resolve a conflict. The consequences of success or failure provide motivation for the characters.',
      patch:
        '@@ -8485,16 +8485,36 @@\n tum is.%0A\n+%3Cpkt_tag_annotation%3E\n Creators\n@@ -8811,16 +8811,37 @@\n racters.\n+%3C/pkt_tag_annotation%3E\n %0AThe tic\n',
      version: '2',
      created_at: '2022-07-28T23:13:01.000Z',
    },
    {
      annotation_id: 'eed69c26-aa18-458b-8753-775bab3e676a',
      item_id: itemId,
      quote:
        'Other musicals zip through time by using “montages” or “musical sequences”—musical numbers that span plot points. Disparate moments are compressed in individual songs either to create greater impact or to help with exposition.\n\n',
      patch:
        '@@ -2898,16 +2898,36 @@\n  there.%0A\n+%3Cpkt_tag_annotation%3E\n Other mu\n@@ -3145,16 +3145,37 @@\n sition.%0A\n+%3C/pkt_tag_annotation%3E\n The 1996\n',
      version: '2',
      created_at: '2022-07-28T23:13:01.000Z',
    },
  ],
});

export const expectedFreeTierResponseSimpleAnnotations = {
  list: {
    '282381128': {
      ...expectedFreeTierResponseSimple.list['282381128'],
      ...expectedAnnotations('282381128'),
    },
    '3833727237': expectedFreeTierResponseSimple.list['3833727237'],
  },
  search_meta: {
    total_result_count: 2,
    offset: 0,
    count: 30,
    has_more: false,
  },
  complete: 1,
  status: 1,
  error: null,
  since: 1709662321,
  maxActions: 30,
  cachetype: 'db',
};

export const expectedFreeTierResponseCompleteAnnotations = {
  list: {
    '282381128': {
      ...expectedFreeTierResponseComplete.list['282381128'],
      ...expectedAnnotations('282381128'),
    },
    '3833727237': expectedFreeTierResponseComplete.list['3833727237'],
  },
  search_meta: {
    total_result_count: 2,
    offset: 0,
    count: 30,
    has_more: false,
  },
  complete: 1,
  status: 1,
  error: null,
  since: 1709662321,
  maxActions: 30,
  cachetype: 'db',
};

export const expectedPremiumTierResponseSimpleAnnotations = {
  search_meta: {
    total_result_count: 22,
    count: 3,
    offset: 0,
    has_more: true,
  },
  complete: 1,
  status: 1,
  error: null,
  since: 1659049987,
  maxActions: 30,
  cachetype: 'db',
  list: {
    '3670270497': expectedPremiumTierResponseSimple.list['3670270497'],
    '3670270094': expectedPremiumTierResponseSimple.list['3670270094'],
    '3457459746': {
      ...expectedPremiumTierResponseSimple.list['3457459746'],
      ...expectedAnnotations('3457459746'),
    },
  },
};
export const expectedPremiumTierResponseCompleteAnnotations = {
  search_meta: {
    total_result_count: 22,
    count: 3,
    offset: 0,
    has_more: true,
  },
  complete: 1,
  status: 1,
  error: null,
  since: 1659049987,
  maxActions: 30,
  cachetype: 'db',
  list: {
    '3670270497': expectedPremiumTierResponseComplete.list['3670270497'],
    '3670270094': expectedPremiumTierResponseComplete.list['3670270094'],
    '3457459746': {
      ...expectedPremiumTierResponseComplete.list['3457459746'],
      ...expectedAnnotations('3457459746'),
    },
  },
};

/**
 * Tack on some annotations to the response on
 * the entity at `index`.
 */
function addAnnotations(
  responseFixture: SearchSavedItemsSimpleQuery,
  index: number,
): SearchSavedItemsSimpleQuery;
function addAnnotations(
  responseFixutre: SearchSavedItemsCompleteQuery,
  index: number,
): SearchSavedItemsCompleteQuery;
function addAnnotations(
  responseFixture: SearchSavedItemsSimpleQuery | SearchSavedItemsCompleteQuery,
  index: number,
): SearchSavedItemsSimpleQuery | SearchSavedItemsCompleteQuery {
  const annotations = {
    highlights: [
      {
        id: 'd4d4fcef-bce1-4676-b291-f8678d08d234',
        quote:
          'Creators of any type of fiction are often advised to include some kind of metaphorical “ticking clock” in their stories— a plot device that puts a time limit on when the protagonist(s) must complete a task or resolve a conflict. The consequences of success or failure provide motivation for the characters.',
        patch:
          '@@ -8485,16 +8485,36 @@\n tum is.%0A\n+%3Cpkt_tag_annotation%3E\n Creators\n@@ -8811,16 +8811,37 @@\n racters.\n+%3C/pkt_tag_annotation%3E\n %0AThe tic\n',
        version: 2,
        _createdAt: 1659049981,
      },
      {
        id: 'eed69c26-aa18-458b-8753-775bab3e676a',
        quote:
          'Other musicals zip through time by using “montages” or “musical sequences”—musical numbers that span plot points. Disparate moments are compressed in individual songs either to create greater impact or to help with exposition.\n\n',
        patch:
          '@@ -2898,16 +2898,36 @@\n  there.%0A\n+%3Cpkt_tag_annotation%3E\n Other mu\n@@ -3145,16 +3145,37 @@\n sition.%0A\n+%3C/pkt_tag_annotation%3E\n The 1996\n',
        version: 2,
        _createdAt: 1659049981,
      },
    ],
  };
  const hydratedEntries =
    responseFixture.user.searchSavedItemsByOffset.entries.map((entry, ix) => {
      if (ix === index) {
        return {
          searchHighlights: entry.searchHighlights,
          savedItem: { ...entry.savedItem, annotations },
        };
      } else {
        return entry;
      }
    });
  return {
    user: {
      searchSavedItemsByOffset: {
        entries: hydratedEntries,
        offset: responseFixture.user.searchSavedItemsByOffset.offset,
        limit: responseFixture.user.searchSavedItemsByOffset.limit,
        totalCount: responseFixture.user.searchSavedItemsByOffset.totalCount,
      },
    },
  };
}

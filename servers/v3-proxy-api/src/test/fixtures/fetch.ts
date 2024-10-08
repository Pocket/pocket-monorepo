import { FetchResponse, GetSharesResponse } from '../../graph/types';

export const expectedFetch: FetchResponse = {
  complete: 1,
  status: 1,
  error: null,
  since: 1706732550,
  maxActions: 30,
  total: '10',
  passthrough: {
    chunk: '1',
    fetchChunkSize: '250',
    firstChunkSize: '25',
  },
  cachetype: 'db',
  list: {
    '2111834840': {
      item_id: '2111834840',
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
          item_id: '2111834840',
          tag: 'research',
        },
        science: {
          item_id: '2111834840',
          tag: 'science',
        },
      },
      listen_duration_estimate: 1707,
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
      listen_duration_estimate: 18,
    },
    '234439595123': {
      item_id: '234439595123',
      given_url: 'https://stories.rivian.com/2024-investor-day',
      given_title: '',
      favorite: '0',
      status: '0',
      time_added: '1706732500',
      time_updated: '1706732535',
      time_to_read: 0,
      time_read: '0',
      time_favorited: '0',
      sort_id: 2,
      resolved_id: '',
      resolved_title: '',
      resolved_url: '',
      excerpt: '',
      is_article: '0',
      is_index: '0',
      has_video: '0',
      has_image: '0',
      word_count: '0',
      lang: '',
      listen_duration_estimate: 0,
    },
  },
};

export const expectedSharesFetch: FetchResponse & GetSharesResponse = {
  ...expectedFetch,
  unconfirmed_shares: [],
  recent_friends: [],
  auto_complete_emails: [],
};

import { gql } from 'apollo-server';

export const BASE_IMAGE_REFERENCE_RESOLVER = gql`
  query ($representations: [_Any!]!) {
    _entities(representations: $representations) {
      ... on Image {
        url
      }
    }
  }
`;

export const IMAGE_REFERENCE_RESOLVER_SOURCE_METADATA = gql`
  query ($representations: [_Any!]!) {
    _entities(representations: $representations) {
      ... on Image {
        url
        width
        height
      }
    }
  }
`;

export const BASE_CACHED_IMAGE_REFERENCE_RESOLVER = gql`
  query ($representations: [_Any!]!) {
    _entities(representations: $representations) {
      ... on Image {
        url
        cachedImages(
          imageOptions: [
            {
              id: "requested-image-1"
              width: 1800
              height: 300
              fileType: WEBP
            }
          ]
        ) {
          url
        }
      }
    }
  }
`;

export const CACHED_IMAGE_REFERENCE_RESOLVER_METADATA = gql`
  query ($representations: [_Any!]!) {
    _entities(representations: $representations) {
      ... on Image {
        url
        cachedImages(
          imageOptions: [
            {
              id: "requested-image-1"
              width: 1800
              height: 300
              fileType: WEBP
            }
          ]
        ) {
          id
          url
          width
          height
        }
      }
    }
  }
`;

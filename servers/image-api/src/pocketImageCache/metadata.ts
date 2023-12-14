import axios from 'axios';
import axiosRetry from 'axios-retry';
import config from '../config';
import { Image } from '../types';
import { getEncodedImageUrl } from './index';

// Retry requests 3 times
axiosRetry(axios, { retries: 3 });

// Exponential back-off retry delay between requests
axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay });

/**
 * Returns the image object by using the meta endpoint of the Pocket Image Cache
 * @param url
 * @returns
 */
export const getImageMetadata = async (url: string): Promise<Image> => {
  const metadataUrl = getImageMetadataUrl(url);

  try {
    const response = await axios.get(metadataUrl);
    return {
      url,
      width: response.data.thumbor.source.width,
      height: response.data.thumbor.source.height,
    };
  } catch (error: any) {
    console.log('Error requesting metadata', { metadata: metadataUrl });
    throw new Error('Could not get image metadata');
  }
};

/**
 * Given a url returns the metadata endpoint for to get width & height of the image
 * @param url
 * @returns
 */
export const getImageMetadataUrl = (url: string): string => {
  const metadataUrl = `${
    config.app.imageCacheEndpoint
  }/meta/${getEncodedImageUrl(url)}`;
  return metadataUrl;
};

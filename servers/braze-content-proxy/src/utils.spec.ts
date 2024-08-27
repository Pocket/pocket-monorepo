import config from './config';
import { validateDate, validateApiKey, getResizedImageUrl } from './utils';

describe('function validateDate', () => {
  it('Allows a date in YYYY-MM-DD format', () => {
    expect(() => {
      validateDate('2050-01-01');
    }).not.toThrow();
  });

  it('Disallows an empty date value', () => {
    expect(() => {
      validateDate('');
    }).toThrowError(
      'Not a valid date. Please provide a date in YYYY-MM-DD format.',
    );
  });

  it('Disallows a date in invalid format', () => {
    expect(() => {
      validateDate('29 Jan, 1900');
    }).toThrowError(
      'Not a valid date. Please provide a date in YYYY-MM-DD format.',
    );
  });
});

describe('function validateApiKey', () => {
  it('should NOT throw an error when correct api key is provided', async () => {
    await expect(validateApiKey(config.aws.brazeApiKey)).resolves.not.toThrow();
  });

  it('should throw an error when an empty string is provided', async () => {
    await expect(validateApiKey('')).rejects.toThrowError(
      config.app.INVALID_API_KEY_ERROR_MESSAGE,
    );
  });

  it('should throw an error when provided key does not match braze api key', async () => {
    await expect(validateApiKey('incorrect-api-key')).rejects.toThrowError(
      config.app.INVALID_API_KEY_ERROR_MESSAGE,
    );
  });
});

describe('function getResizedImageUrl', () => {
  it('should return resize image url with default filters when no filters are provided', () => {
    const imageUrl = 'www.my-image-url.com';
    const resizedImageUrl =
      `${config.images.protocol}://${config.images.host}/${config.images.width}x${config.images.height}/filters:${config.images.filters}/`.concat(
        encodeURIComponent(imageUrl),
      );

    expect(getResizedImageUrl(imageUrl)).toEqual(resizedImageUrl);
  });

  it('should return resize image url with the correct filter values', () => {
    const imageUrl = 'www.my-image-url.com';
    const customFilters = {
      width: 200,
      height: 200,
      filters: 'format(jpeg):quality(90):no_upscale():strip_exif()',
    };
    const resizedImageUrl =
      `${config.images.protocol}://${config.images.host}/${customFilters.width}x${customFilters.height}/filters:${customFilters.filters}/`.concat(
        encodeURIComponent(imageUrl),
      );

    expect(
      getResizedImageUrl(
        imageUrl,
        customFilters.width,
        customFilters.height,
        customFilters.filters,
      ),
    ).toEqual(resizedImageUrl);
  });
});

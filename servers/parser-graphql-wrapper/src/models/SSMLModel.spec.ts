import { SSMLModel } from './SSMLModel.js';

describe('SSML', () => {
  it('should generate SSML text from html with data', () => {
    const input =
      '<p>A paragraph with an <b>image</b><img src="https://123"/></p><h1>heading</h1><p>Another paragraph with some <em>em</em> text</p>';

    const ssml = SSMLModel.generateSSML({
      id: 'fo562fkc52f1ee092fOXe3Z2a7907eb576688dccd6e6a7fh4754a0d22d',
      title: 'The Example Article',
      isArticle: true,
      article: input,
      itemId: '123',
      resolvedId: '123',
      normalUrl: 'https://something-to.test',
      authors: [],
      domainMetadata: {
        logo: '',
        name: 'Mozilla',
      },
      givenUrl: 'https://something-to.test',
      readerSlug: 'fo562fkc52f1ee092fOXe3Z2a7907eb576688dccd6e6a7fh4754a0d22d',
    });

    expect(ssml).toBe(
      "<speak><prosody rate='medium' volume='medium'>The Example Article, published by Mozilla.</prosody><prosody rate='medium' volume='medium'> A paragraph with an  image    heading  Another paragraph with some  em  text </prosody></speak>",
    );
  });

  it('should generate SSML text from html with data, with publish date', () => {
    const input =
      '<p>A paragraph with an <b>image</b><img src="https://123"/></p><h1>heading</h1><p>Another paragraph with some <em>em</em> text</p>';

    const ssml = SSMLModel.generateSSML({
      title: 'The Example Article',
      isArticle: true,
      article: input,
      datePublished: '2023-04-26 07:30:00',
      itemId: '123',
      id: 'fo562fkc52f1ee092fOXe3Z2a7907eb576688dccd6e6a7fh4754a0d22d',
      resolvedId: '123',
      normalUrl: 'https://something-to.test',
      authors: [],
      domainMetadata: {
        logo: '',
        name: 'Mozilla',
      },
      givenUrl: 'https://something-to.test',
      readerSlug: 'fo562fkc52f1ee092fOXe3Z2a7907eb576688dccd6e6a7fh4754a0d22d',
    });

    expect(ssml).toBe(
      "<speak><prosody rate='medium' volume='medium'>The Example Article, published by Mozilla, on <say-as interpret-as='date' format='m/d/y'>4/26/2023</say-as></prosody><prosody rate='medium' volume='medium'> A paragraph with an  image    heading  Another paragraph with some  em  text </prosody></speak>",
    );
  });
});

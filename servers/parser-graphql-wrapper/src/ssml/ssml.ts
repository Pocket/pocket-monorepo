import { decode } from 'html-entities';
import { Item } from '../__generated__/resolvers-types';

// From https://github.com/Pocket/scout-ua/blob/master/command/texttools.js#L27
const cleanText = (htmlStr) => {
  // Remove the HTML marks.
  let strippedHtml = htmlStr.replace(/<[^>]+>/g, ' ');

  // Now replace the quotes and other markups.
  strippedHtml = strippedHtml
    .replace(/&amp;/g, ' and ')
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&mdash;/g, '-')
    .replace(/&ndash;/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/&thinsp;/g, '');

  //This next line turns encoded int'l chars into proper char
  //example: pr&eacute;sid&eacute; ==> présidé à
  strippedHtml = decode(strippedHtml);
  //Clean up any last html codes and diacriticals that
  //contain & so it doesn't choke ssml.
  strippedHtml = strippedHtml.replace(/&[^\s]*/g, '');
  strippedHtml = strippedHtml.replace(/[<>]/g, '');
  return strippedHtml;
};

// From https://github.com/Pocket/scout-ua/blob/4435fcdb9154f99b1d27906c3d63f1988ea816c9/command/CommandController.js#L1116
const buildIntro = (
  articleTitle: string,
  articleLang?: string,
  timePublished?: string,
  publisher?: string,
): string => {
  //Intro: “article title, published by host, on publish date"
  let introFullText;
  if (!articleLang || articleLang === 'en') {
    if (timePublished) {
      const publishedDate = new Date(Date.parse(timePublished));
      const dateString = `<say-as interpret-as='date' format='m/d/y'>${publishedDate.getMonth()}/${publishedDate.getDay()}/${publishedDate.getFullYear()}</say-as>`;

      introFullText = publisher
        ? `${articleTitle}, published by ${publisher}, on ${dateString}`
        : `${articleTitle}, published on ${dateString}`;
    } else {
      // The case where date is not available.
      introFullText = publisher
        ? `${articleTitle}, published by ${publisher}.`
        : `${articleTitle}.`;
    }
  } else {
    if (timePublished) {
      const publishedDate = new Date(Date.parse(timePublished));
      const dateString = `<say-as interpret-as='date' format='m/d/y'>${publishedDate.getMonth()}/${publishedDate.getDay()}/${publishedDate.getFullYear()}</say-as>`;

      introFullText = publisher
        ? `${articleTitle}, ${publisher}, ${dateString}`
        : `${articleTitle}, ${dateString}`;
    } else {
      // The case where date is not available.
      introFullText = publisher
        ? `${articleTitle}, ${publisher}.`
        : `${articleTitle}.`;
    }
  }
  return introFullText;
};

/**
 * Super simple SSML generation, with the baseline mimicing what Listen does as of May 2nd, 2023
 * In the future we can utilize the full markup at https://cloud.google.com/text-to-speech/docs/ssml to build more
 * natural sounding article bodies from the HTML or MArticle structure.
 * @param item
 * @returns
 */
export const generateSSML = (item: Item): string | null => {
  if (!item.isArticle || item.article == null) {
    return null;
  }

  return `<speak>${generateIntroSSML(
    item.title,
    item.language,
    item.datePublished,
    item.domainMetadata.name,
  )}${generateSSMLFromArticleHTML(item.article)}</speak>`;
};

const generateIntroSSML = (
  articleTitle: string,
  articleLang: string,
  timePublished?: string,
  publisher?: string,
): string => {
  return `<prosody rate='medium' volume='medium'>${buildIntro(
    articleTitle,
    articleLang,
    timePublished,
    publisher,
  )}</prosody>`;
};

// From https://github.com/Pocket/scout-ua/blob/4435fcdb9154f99b1d27906c3d63f1988ea816c9/command/CommandController.js#L1207
const generateSSMLFromArticleHTML = (html: string): string => {
  const cleanedText = cleanText(html);
  // In the future do more with speach, etc.
  return `<prosody rate='medium' volume='medium'>${cleanedText}</prosody>`;
};

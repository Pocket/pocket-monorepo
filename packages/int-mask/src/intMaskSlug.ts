import { IntMask } from './intMask';
import md5 from 'md5';

const ITEM_ID_DELIMENTATOR = '_';

export const createReaderSlug = (itemId: string) => {
  return `${IntMask.encode(itemId)}${ITEM_ID_DELIMENTATOR}${md5(itemId)}`;
};

export const itemIdFromSlug = (slug: string) => {
  const [encodedId, md5Hash] = slug.split(ITEM_ID_DELIMENTATOR);
  const id = IntMask.decode(encodedId).toString();
  if (md5(id) !== md5Hash) {
    return null;
  }

  return id;
};

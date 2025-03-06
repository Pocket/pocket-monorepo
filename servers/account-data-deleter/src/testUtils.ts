import Chance from 'chance';

export function seed(
  userId: number,
  listCount: number,
  annotationCount: number,
  chance?: Chance.Chance,
) {
  const now = new Date();
  const rand = chance ?? new Chance();
  const randDate = () =>
    rand.date({
      min: new Date('2014-01-01T00:00:00.000Z'),
      max: now,
    }) as Date;
  const list = [...Array(listCount).keys()].map((itemId) => {
    return {
      user_id: userId,
      item_id: itemId + 1,
      resolved_id: itemId + 1,
      given_url: rand.url(),
      title: rand.sentence({ words: 7 }),
      time_added: randDate(),
      time_updated: randDate(),
      time_read: randDate(),
      time_favorited: randDate(),
      api_id: 123,
      status: rand.weighted([0, 1, 2], [10, 5, 1]),
      favorite: rand.weighted([0, 1], [10, 1]),
      api_id_updated: 123,
    };
  });
  // Force some items with none and more with multiple
  const listItems = rand.pickset(
    list.map((_) => _.item_id),
    Math.round(Math.max(listCount, annotationCount) / 4),
  );
  const annotations = [...Array(annotationCount).keys()].map((_) => {
    return {
      annotation_id: rand.guid({ version: 4 }),
      user_id: userId,
      item_id: rand.pickone(listItems),
      quote: rand.sentence(),
      created_at: randDate(),
      patch: '<pkt_annotation></pkt_annotation>',
    };
  });
  return { list, annotations };
}

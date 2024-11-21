export const Note = (chance: Chance.Chance) => {
  const timestamp = chance.hammertime();
  return {
    id: chance.integer({ min: 0, max: 2000000 }),
    noteId: chance.guid({ version: 4 }),
    userId: chance.integer({ min: 1, max: 2000000 }).toString(),
    title: chance.bool() ? chance.sentence({ words: 5 }) : undefined,
    sourceUrl: chance.bool() ? chance.url() : undefined,
    createdAt: new Date(timestamp),
    updatedAt: new Date(
      timestamp + chance.integer({ min: 0, max: 259200 * 1000 }),
    ),
    deleted: chance.bool({ likelihood: 10 }),
    archived: chance.bool({ likelihood: 10 }),
    docContent: docContent(chance),
  };
};

/**
 * Generator for doc of basic plaintext paragraphs
 * (configurable size)
 */
export const docContent = (
  chance: Chance.Chance,
  options?: { paragraphs: number },
) => {
  const n = options?.paragraphs ?? chance.natural({ max: 5 });
  const paragraphs = [...Array(n).keys()].map((_) => ({
    type: 'paragraph',
    attrs: { textAlign: 'left' },
    content: [{ type: 'text', text: chance.paragraph() }],
  }));
  return {
    type: 'doc',
    content: paragraphs,
  };
};

import { JSONSchemaType } from 'ajv';
import { OmnivoreImportRecord, OmnivoreState } from './types';

export const omnivoreSchema: JSONSchemaType<OmnivoreImportRecord> = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    slug: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    author: { type: 'string', nullable: true },
    url: { type: 'string', format: 'url' },
    state: { type: 'string', enum: Object.values(OmnivoreState) },
    readingProgress: { type: 'number' },
    thumbnail: { type: 'string', nullable: true },
    labels: {
      type: 'array',
      items: { type: 'string' },
    },
    savedAt: { type: 'string', format: 'iso-8601-dt' },
    updatedAt: { type: 'string', format: 'iso-8601-dt' },
    publishedAt: { type: 'string', format: 'iso-8601-dt', nullable: true },
  },
  required: [
    'id',
    'slug',
    'title',
    'url',
    'state',
    'readingProgress',
    'labels',
    'savedAt',
    'updatedAt',
  ],
  additionalProperties: false,
};

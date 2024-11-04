import { Ajv } from 'ajv';

const _ajv = new Ajv();

// ISO-string format, like 2024-10-30T12:39:28.023Z
_ajv.addFormat('iso-8601-dt', {
  type: 'string',
  validate: (x: string) => {
    const dt = Date.parse(x);
    if (!isNaN(dt) && new Date(dt).toISOString() === x) {
      return true;
    }
    return false;
  },
});

_ajv.addFormat('url', {
  type: 'string',
  validate: (x: string) => {
    try {
      new URL(x);
    } catch {
      return false;
    }
    return true;
  },
});

export const ajv = _ajv;

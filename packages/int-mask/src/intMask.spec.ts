import { IntMask } from './intMask.js';

describe('intMask', () => {
  it.each([
    {
      input: 123455,
      expected:
        '50b91cc7fBMaCa10a9Ad5ZeC5eDc4d6eYaX05Sb1GeD63Af3EbT2f086B8eE6dd3',
    },
    {
      input: 2342344234,
      expected:
        '07ao3c894BWaC4faV1K0dPeMbbD40624Oaf24X80Q1SeeAc4Ya7aa0dcBaiEe787',
    },
  ])('encodes', ({ input, expected }) => {
    expect(IntMask.encode(input)).toBe(expected);
  });

  it.each([
    {
      input: '50b91cc7fBMaCa10a9Ad5ZeC5eDc4d6eYaX05Sb1GeD63Af3EbT2f086B8eE6dd3',
      expected: 123455,
    },
    {
      input: '07ao3c894BWaC4faV1K0dPeMbbD40624Oaf24X80Q1SeeAc4Ya7aa0dcBaiEe787',
      expected: 2342344234,
    },
  ])('decodes', ({ input, expected }) => {
    expect(IntMask.decode(input)).toBe(expected);
  });
});

import { possiblyTruncated } from './Max300CharString';
describe('Max300CharString', () => {
  it('truncates strings longer than 300 characters (ellipses suffix)', () => {
    const longString = 'why' + new Array(300).fill('y').join('');
    expect(longString.length).toBeGreaterThan(300);
    const expected =
      'whyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy' +
      'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy' +
      'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy' +
      'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy' +
      'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy' +
      'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy...';
    const actual = possiblyTruncated(longString);
    expect(actual).toEqual(expected);
  });
  it('does not truncate shorter strings', () => {
    const shorterString = 'whyyyyyyyyyyyyy?';
    const actual = possiblyTruncated(shorterString);
    expect(actual).toEqual(shorterString);
  });
});

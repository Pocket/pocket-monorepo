import basicText from '../test/documents/basicText.json';
import { ProseMirrorDoc, wrapDocInBlockQuote } from './ProseMirrorDoc';
import { schema } from 'prosemirror-markdown';
import fromQuote from '../test/documents/fromQuote.json';
import { UserInputError } from '@pocket-tools/apollo-utils';

describe('ProseMirrorDoc', () => {
  // TODO - Improve specificity when preview format is decided
  describe('preview', () => {
    it('converts a multi-paragraph input to a string', () => {
      const doc = new ProseMirrorDoc(basicText, schema);
      expect(doc.preview).toBeString();
    });
  });
  describe('quote constructor', () => {
    it('wraps quote in blockquote and adds attribution', () => {
      const { input, expectedSource } = fromQuote;
      const actual = wrapDocInBlockQuote(input, { source: 'localhost:3001' });
      expect(actual).toEqual(expectedSource);
    });
    it('wraps quote in blockquote without attribution', () => {
      const { input, expectedNoSource } = fromQuote;
      const actual = wrapDocInBlockQuote(input);
      expect(actual).toEqual(expectedNoSource);
    });
    it('throws error if an invalid node is encountered', () => {
      const bad = {
        type: 'doc',
        content: [
          {
            type: 'invalid',
            content: [
              {
                type: 'text',
                text: '',
              },
            ],
          },
        ],
      };
      expect(() => wrapDocInBlockQuote(bad)).toThrowWithMessage(
        UserInputError,
        /.*Invalid Document.*/,
      );
    });
  });
});

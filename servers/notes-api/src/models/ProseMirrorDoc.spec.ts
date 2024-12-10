import basicText from '../test/documents/basicText.json';
import {
  docFromMarkdown,
  ProseMirrorDoc,
  wrapDocInBlockQuote,
} from './ProseMirrorDoc';
import { schema } from 'prosemirror-markdown';
import fromQuote from '../test/documents/fromQuote.json';
import badMd from '../test/documents/badMd.json';
import { UserInputError } from '@pocket-tools/apollo-utils';
import * as fs from 'fs';
import path from 'path';

const basicTextMd = fs.readFileSync(
  path.resolve(__dirname, '../test/documents/basicTextMD.txt'),
  'utf8',
);

describe('ProseMirrorDoc', () => {
  // TODO - Improve specificity when preview format is decided
  describe('preview', () => {
    it('converts a multi-paragraph input to a string', () => {
      const doc = new ProseMirrorDoc(basicText, schema);
      expect(doc.preview).toBeString();
    });
  });
  describe('markdown', () => {
    it('smoke test: converts a multi-paragraph input to a string', () => {
      const doc = new ProseMirrorDoc(basicText, schema);
      expect(doc.markdown).toBeString();
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
  describe('markdown parser', () => {
    it('parses plain text paragraphs', () => {
      const doc = docFromMarkdown(basicTextMd);
      expect(doc.toJSON()).toEqual(basicText);
    });
    it('passes invalid markdown as literal string content', () => {
      const doc = docFromMarkdown(badMd.md);
      expect(doc.toJSON()).toEqual(badMd.pm);
    });
    it('works for empty string', () => {
      const doc = docFromMarkdown('');
      const expected = {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      };
      expect(doc.toJSON()).toEqual(expected);
    });
  });
});

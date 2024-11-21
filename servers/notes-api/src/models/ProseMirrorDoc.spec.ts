import basicText from '../test/documents/basicText.json';
import { ProseMirrorDoc } from './ProseMirrorDoc';
import { schema } from 'prosemirror-markdown';

describe('ProseMirrorDoc', () => {
  // TODO - Improve specificity when preview format is decided
  it('converts a multi-paragraph input to a string', () => {
    const doc = new ProseMirrorDoc(basicText, schema);
    expect(doc.preview).toBeString();
  });
});

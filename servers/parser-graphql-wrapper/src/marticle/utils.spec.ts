import domino from 'domino';
import { countAncestors } from './utils.js';

/**
 * Make a chain of nodes with linear parentage, helper function
 * for testing the ancestry function
 * @param tagList nodes to have sequential parent-child
 * relationships; first node in the list is the oldest
 * ancestor, last is the youngest child
 * @returns pointer to the youngest child in the ancestry
 * chain
 */
function ancestryChain(tagList: string[]) {
  const window = domino.createWindow('');
  const document = window.document;
  const root = document.createElement(tagList.shift());
  if (tagList.length === 0) {
    return root;
  }
  const deepestChild = tagList.reduce((parent, tag) => {
    const child = document.createElement(tag);
    parent.appendChild(child);
    return child;
  }, root);
  return deepestChild;
}

describe('Marticle utils', () => {
  describe('countAncestors', () => {
    it('should return 0 if no matching ancestors', () => {
      const child = ancestryChain(['ul', 'li']);
      expect(countAncestors(child, 'li')).toBe(0);
    });
    it('should return the number of ancestors', () => {
      const child = ancestryChain(['ul', 'ul', 'li']);
      expect(countAncestors(child, 'ul')).toBe(2);
    });
    it('should return the correct number of ancestors with generation gaps', () => {
      const child = ancestryChain(['ul', 'li', 'ul', 'li']);
      expect(countAncestors(child, 'ul')).toBe(2);
    });
    it('should return 0 if node has no parents', () => {
      const root = ancestryChain(['p']);
      expect(countAncestors(root, 'p')).toBe(0);
    });
  });
});

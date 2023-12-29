import domino from 'domino';

/**
 * Count the number of ancestor nodes that match `nodeName`
 * in the tree.
 * @param node the node to check ancestors of
 * @param nodeName: a DOMString containing a selector string to match
 * to parent nodes
 */
export function countAncestors(node: Node, nodeName: string): number {
  let count = 0;
  let currentNode = node;
  while (currentNode?.parentElement != null) {
    const prevAncestor = currentNode.parentElement.closest(nodeName);
    if (prevAncestor != null) {
      count += 1;
    }
    currentNode = prevAncestor;
  }
  return count;
}

/**
 * Count the number of previous (left-hand) siblings that match `nodeName`
 * in the tree, given a node.
 * @param node the node to check siblings of
 * @param nodeName: a DOMString containing a selector string to match to sibling node(s)
 * @returns count of previous (left-hand) siblings matching `nodeName`
 */
export function countPreviousSiblings(node: Node, nodeName: string): number {
  let count = 0;
  let currentNode = node;
  while (currentNode?.previousSibling != null) {
    const prevSibling = currentNode.previousSibling;
    if (prevSibling.nodeName === nodeName) {
      count += 1;
    }
    currentNode = prevSibling;
  }
  return count;
}

/**
 * Build a new subtree by setting a new parent for all
 * the top-level children.
 * Ref: https://github.com/fgnass/domino
 * @param parentTag html tag to use for the root element
 * @param childNodes array of top-level child nodes to attach
 * to the new root
 * @returns a new root element of type parentTag with attached
 * child nodes
 */
export function createSubtree(parentTag: string, childNodes: Node[]): Node {
  const window = domino.createWindow('');
  const document = window.document;
  const root = document.createElement(parentTag);
  childNodes.forEach((child: Node) => root.appendChild(child));
  return root;
}

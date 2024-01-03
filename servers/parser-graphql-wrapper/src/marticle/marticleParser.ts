import domino from 'domino';
import {
  ListElement,
  NumberedListElement,
  MarticleBulletedList,
  MarticleNumberedList,
  MarticleComponent,
  MarticleCodeBlock,
  MarticleDivider,
  MarticleHeading,
  MarticleTable,
  MarticleText,
  MarticleBlockquote,
  UnMarseable,
} from './marticleTypes';
import { countAncestors, countPreviousSiblings, createSubtree } from './utils';
import turndownService from './turndown';
import TurndownService from 'turndown';
import { ParserArticle } from '../datasources/parserApi';
import { Image, Video, videoTypeMap } from '../model';
import { config } from './config';

type ParserMediaMap = {
  [key: string]: SrcRecord;
};
interface SrcRecord {
  [key: string]: any;
  src: string;
}

export type MarticleElement =
  | MarticleComponent
  | MarticleBulletedList
  | MarticleNumberedList
  | MarticleTable
  | MarticleCodeBlock
  | Image
  | Video;

// Components we don't support
const unMarseableComponents = [
  'DL',
  'AUDIO',
  'SCRIPT',
  'IFRAME',
  'math', // idk why not capitalized?
  'MATH', // duplicated to be sure
  'DETAILS',
  'DIALOG',
  'MENU',
];

// Finding one of these tags can trigger processing
// any left-hand siblings that contain an 'eventualComponent'.
// These are 'block' components that can't/shouldn't need to be
// split into multiple Marticle* Components.
const immediateComponents = [
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'PRE',
  'HR',
  'TABLE',
  'UL',
  'OL',
  '#comment',
  ...unMarseableComponents,
];

// Can't process these tags unless the entire subtree has been
// visited, or a right-hand sibling of 'immediateComponent'
// has been found. These might need to be split into multiple
// Marticle* components, since the Marticle format is flat.
// e.g. a 'p' subtree might contain an 'img' child, but not the other
// way around. So if a 'p' tree contains children: [text, image, text],
// then we need 3 components (MarticleText, Image, MarticleText)
// to represent it in a flat list ('splitting' the 'p' node into 2).
const eventualComponents = ['P', 'BLOCKQUOTE', 'LI', 'DIV'];

function unMarseableTransformer(root: Node): UnMarseable {
  return {
    __typeName: 'UnMarseable',
    html: (root as Element).outerHTML,
  };
}
// Assign UnMarseable transformer to all UnMarseable tags
const unMarseableTransformers = unMarseableComponents.reduce(
  (transformerMap, tag) => {
    transformerMap[tag] = unMarseableTransformer;
    return transformerMap;
  },
  {},
);

// Methods for transforming a subtree of the DOM that represents
// an article into one or more MarticleComponents.
// To avoid many if/else statements, create a map of root tag
// to transformer function.
// Additional transformers should be added to this map.
const transformers = {
  ...unMarseableTransformers,
  P: (children: Node[]): MarticleText | MarticleBlockquote => {
    //if ancestor is bquote
    const blockquoteAncestor = children[0].parentElement.closest('blockquote');
    children.forEach((child) => child.parentNode.removeChild(child));
    const subtree = createSubtree('p', children) as TurndownService.Node;
    const content = turndownService.turndown(subtree);
    // Don't return empty content; this can sometimes happen for text nodes
    if (content != '') {
      return {
        __typeName: blockquoteAncestor ? 'MarticleBlockquote' : 'MarticleText',
        content: turndownService.turndown(subtree),
      };
    }
    return null;
  },
  DIV: (children: Node[]): MarticleText => {
    children.forEach((child) => child.parentNode.removeChild(child));
    // TODO: should check to make sure there aren't any types we don't want to parse?
    // this is problem for all eventual components... e.g. definition lists
    const subtree = createSubtree('p', children) as TurndownService.Node;
    // Don't return empty content; this can sometimes happen for text nodes
    const content = turndownService.turndown(subtree);
    if (content != '') {
      return {
        __typeName: 'MarticleText',
        content: content,
      };
    }
    return null;
  },
  BLOCKQUOTE: (children: Node[]): MarticleBlockquote => {
    children.forEach((child) => child.parentNode.removeChild(child));
    const subtree = createSubtree('p', children) as TurndownService.Node;
    // Don't return empty content; this can sometimes happen for text nodes
    const content = turndownService.turndown(subtree);
    if (content != '') {
      return {
        __typeName: 'MarticleBlockquote',
        content: content,
      };
    }
    return null;
  },
  HR: (root: Node): MarticleDivider => {
    return {
      __typeName: 'MarticleDivider',
      content: '---',
    };
  },
  TABLE: (root: Node): MarticleTable => ({
    __typeName: 'MarticleTable',
    // outerHTML only available on Element, not Node
    // Is there a less janky way to do this?
    html: root.firstChild.parentElement.outerHTML,
  }),
  H1: (root: Node): MarticleHeading => headingTransformer(root, 1),
  H2: (root: Node): MarticleHeading => headingTransformer(root, 2),
  H3: (root: Node): MarticleHeading => headingTransformer(root, 3),
  H4: (root: Node): MarticleHeading => headingTransformer(root, 4),
  H5: (root: Node): MarticleHeading => headingTransformer(root, 5),
  H6: (root: Node): MarticleHeading => headingTransformer(root, 6),
  PRE: (root: Node): MarticleCodeBlock => ({
    // textContent returns a concatenated string of
    // all the child elements for a given node
    text: root.textContent,
    __typeName: 'MarticleCodeBlock',
  }),
  // The typing gets difficult for lists
  // Lists can be broken up, so the transformer can return any kind
  // of Marticle* component ( + lists).
  // Kind of cheating on types for documentation purposes
  UL: (root: Node, article: ParserArticle): MarticleElement[] => {
    const { output, aggFrom } = listTransformer(
      root,
      [],
      'UL',
      undefined,
      article,
    );
    // Result might contain rows that need to be aggregated into a single
    // MarticleBulletedList
    if (aggFrom != null) {
      const aggOutput = output.splice(aggFrom) as ListElement[];
      output.push({
        __typeName: 'MarticleBulletedList',
        rows: aggOutput,
      });
    }
    return output as MarticleElement[];
  },
  OL: (root: Node, article: ParserArticle): MarticleElement[] => {
    const { output, aggFrom } = listTransformer(
      root,
      [],
      'OL',
      undefined,
      article,
    );
    if (aggFrom != null) {
      const aggOutput = output.splice(aggFrom) as NumberedListElement[];
      output.push({
        __typeName: 'MarticleNumberedList',
        rows: aggOutput,
      });
    }
    return output as MarticleElement[];
  },
  LI: (children: Node[]): ListElement | NumberedListElement => {
    // The parent element is LI if at this function
    // I can definitely get the index with respect to its siblings,
    // but for some reason the type doesn't have it there... so cast to any
    const parentNode = children[0].parentNode as HTMLLIElement;
    // Slightly different response depending on ordered or unordered list
    const parentType =
      children[0].parentNode.parentNode.nodeName == 'OL' ? 'OL' : 'UL';
    // Can have nested list types so need to count both ancestors
    const level =
      countAncestors(children[0], 'OL') + countAncestors(children[0], 'UL');
    children.forEach((child) => child.parentNode.removeChild(child));
    // Don't include 'ul/ol' nodes since they will have already been processed
    const childrenToProcess = children.filter(
      (child) => child.nodeName != parentType,
    );
    if (childrenToProcess.length > 0) {
      const subtree = createSubtree(
        'div',
        childrenToProcess,
      ) as TurndownService.Node;
      if (parentType == 'OL') {
        return {
          index: countPreviousSiblings(parentNode, 'LI'),
          level: level - 1,
          content: turndownService.turndown(subtree),
        };
      } else {
        return {
          level: level - 1,
          content: turndownService.turndown(subtree),
        };
      }
    }
    return null;
  },
  // The legacy parser service can return images and videos
  // as HTML comments the represent the type of media and
  // their position. Check if an HTML comment is a media
  // comment and replace with a marticle media component
  '#comment': (
    root: Node,
    article: ParserArticle,
  ): ((Image | Video) & { __typeName: string }) | UnMarseable => {
    const text = root.textContent.trim();

    // If an image comment is found, replace it with an Image component
    if (text.indexOf('IMG_') >= 0) {
      // TODO: Fix this typing -- needs a number of changes to get it correct
      // (previously was implied 'any' type)
      const image: any = getParserMediaFromComment(
        root.textContent,
        article.images,
      );

      // Check to see if the media is also a link (has an `a` tag ancestor)
      // We remove <a> tags without any text content from the output, so it
      // won't result in an empty link when the <a> node is processed
      const parentLink = root.parentElement?.closest('A');
      const link = parentLink ? parentLink.getAttribute('href') : null;

      if (!image)
        return {
          __typeName: 'UnMarseable',
          html: config.UnMarseable.imageFallback,
        };

      return {
        ...image,
        __typeName: 'Image',
        imageId: parseInt(image.image_id),
        width: parseInt(image.width) || null,
        height: parseInt(image.height) || null,
        targetUrl: link,
      };
    }

    // If a video comment is found, replace it with an Video component
    if (text.indexOf('VIDEO_') >= 0) {
      const video = getParserMediaFromComment(root.textContent, article.videos);

      if (!video)
        return {
          __typeName: 'UnMarseable',
          html: config.UnMarseable.videoFallback,
        };

      return {
        ...video,
        __typeName: 'Video',
        videoId: parseInt(video.video_id),
        width: parseInt(video.width) || null,
        height: parseInt(video.height) || null,
        type: videoTypeMap[video.type],
      };
    }
  },
};

/**
 * Transformer for heading tags
 * @param headingRoot the root node for the heading (h1, ... h6)
 * @param level the level of the heading
 * @returns MarticleHeading
 */
function headingTransformer(headingRoot: Node, level: number): MarticleHeading {
  // For some reason the '#' markup doesn't show up with turndown when you pass
  // the root element directly, but does work if you pass the html
  return {
    __typeName: 'MarticleHeading',
    content: turndownService.turndown((headingRoot as Element).outerHTML),
    level: level,
  };
}

/**
 * DOM parsers arrange elements in the <head> and <body>.
 * Wrapping in a custom element ensures elements are reliably arranged in
 * a single element. This is a consistent entrypoint for processing the
 * relevant data in the DOM tree.
 */
function RootNode(input: string) {
  const doc = domino.createDocument(
    '<x-marticle id="marticle-root">' + input + '</x-marticle>',
    null,
  );
  return doc.getElementById('marticle-root');
}

/**
 * Entry point for processing an article's html from the parser
 * into an array of MarticleComponents.
 * @param html the article's html, returned by the parser
 * @param parserArticle parser data on images and videos
 * @returns an array of MarticleComponents representing the article
 */
export function parse(
  html: string,
  parserArticle?: ParserArticle,
): MarticleElement[] {
  const tree = RootNode(html);
  return visitDeep(tree, [], parserArticle);
}

/**
 *
 * @param article
 */
export function parseArticle(article: ParserArticle): MarticleElement[] {
  return parse(article.article, article);
}

/**
 * !Recursion alert!
 * Recursive parsing method to turn an html article into marticle.
 * Visits N-ary nodes in a DOM tree in a depth-first fashion,
 * and converts them to a flat list of Marticle* components.
 * See README for more information and examples.
 * @param node the root node of the tree
 * @param output Output from the prior recursive call
 * @param parserArticle
 */
function visitDeep(
  node: Node,
  output: any[],
  parserArticle?: ParserArticle,
  hasEventualAncestor?: boolean,
): MarticleElement[] {
  if (eventualComponents.indexOf(node.nodeName) >= 0) {
    hasEventualAncestor = true;
  }
  // Since the parent may have its child nodes updated dynamically,
  // iterate over a copy of the original child nodes
  const childNodes = Array.from(node.childNodes);
  childNodes.forEach((child: Node) => {
    const isImmediateComponent =
      immediateComponents.indexOf(child.nodeName) >= 0;
    // reach immediate component or nested eventual component
    if (
      isImmediateComponent ||
      (hasEventualAncestor && eventualComponents.indexOf(child.nodeName) >= 0)
    ) {
      const leftOutput = processSubtree(
        Array.from(node.childNodes).slice(
          // TODO: Should only ever have one left-hand sibling that should be processed?
          // Since we should process any eventualComponents once its subtree is visited?
          0,
          Array.prototype.indexOf.call(node.childNodes, child),
        ),
        child.parentNode.nodeName,
      );
      if (leftOutput != null) {
        output.push(leftOutput);
      }
      // Process current node if immediate component
      // otherwise continue recursively
      if (isImmediateComponent) {
        const currentNodeOutput = processCurrentNode(child, parserArticle);
        if (currentNodeOutput != null) {
          if (currentNodeOutput instanceof Array) {
            output = output.concat(currentNodeOutput);
          } else {
            output.push(currentNodeOutput);
          }
        }
      }
    }
    output = visitDeep(child, output, parserArticle, hasEventualAncestor);
    // TODO: Will likely need special case for nested blockquotes.

    // This case is reached when we are finished after exiting the recursive
    // stack on a node's children, and is "revisiting" the parent node;
    // if it's a paragraph or blockquote then we have visited all the
    // child nodes and we need to trigger processing for the entire subtree.
    // Since child nodes are removed from the parent as they are processed
    // recursively using `processSubtree` or `processNode`, only unprocessed
    // nodes will be included in this method.
    if (eventualComponents.indexOf(child.nodeName) >= 0) {
      const subtreeRes = processSubtree(
        Array.from(child.childNodes),
        child.nodeName,
      );
      if (subtreeRes != null) {
        output.push(subtreeRes);
      }
      child.parentNode.removeChild(child);
    }
  });
  return output;
}

/**
 * Processes a list of child nodes intended to compose a subtree.
 * Used to trigger processing an 'eventual component', like a 'p' tag,
 * when encountering an 'immediate component', like an 'img' tag.
 * Since we are processing left to right, if the above case is encountered
 * then the maximum possible subtree has been discovered for the left-hand
 * 'eventual component', and we can process it.
 * 'Orphans' the child nodes before sending them to the appropriate
 * processor function. This ensures the nodes are only processed once.
 * However, the children don't need to be removed. If this method is being
 * called then the children have already been visited, so it won't save any
 * recursive calls.
 * All children should have a parent of `parentType`.
 * @param children the child nodes to process as a distinct subtree
 * @param parentType the original parent node type of the children
 * @returns
 */
function processSubtree(children: Node[], parentType: string) {
  if (children.length === 0) {
    return null;
  }
  return transformers[parentType] ? transformers[parentType](children) : null;
}

/**
 * TODO
 * Processes a node and its children to create a MarticleComponent.
 * Only used for 'safe' MarticleComponents that are certain to not
 * be split, e.g. 'h1', 'pre -> code', etc.
 * Can't be used for 'p', 'li', etc.
 * @param node the root of the subtree to process into a MarticleComponent.
 * @param article
 */
function processCurrentNode(node: Node, article: ParserArticle) {
  const component = transformers[node.nodeName]
    ? transformers[node.nodeName](node, article)
    : null;
  // Remove from its parent to make processing any unfinished
  // siblings easier
  node.parentNode.removeChild(node);
  // Remove children to stop recursive call
  node.childNodes.forEach((child: Node) => node.removeChild(child));
  return component;
}

const listTypeMap = {
  UL: 'MarticleBulletedList',
  OL: 'MarticleNumberedList',
};

/**
 * Process ordered or unordered lists. This is a modified version of visitDeep
 * for lists. Rows are processed recursively like visitDeep, and are aggregated
 * into a single List component when an immediate component is encountered.
 * Returns the output and a number (or null), which indicates the start index
 * for components that need to be aggregated before returning the final result.
 *
 * @param node node currently processing recursively
 * @param output running list of output
 * @param listType either 'UL' or 'OL'
 * @param aggFrom processed rows that need to be aggregated into a single list component
 * @param article object containing the html article, given URL, images and videos
 * @returns
 *   output: the transformed result; may contain un-aggregated rows
 *   aggFrom: if not null, the start index from which rows must be aggregated into a
 *            Marticle*List component, in the output
 */
function listTransformer(
  node: Node,
  output: any[],
  listType: 'UL' | 'OL',
  aggFrom: number,
  article: ParserArticle,
): {
  output: Array<MarticleElement | NumberedListElement | ListElement>;
  aggFrom: number | null;
} {
  // Since the parent may have its child nodes updated dynamically,
  // iterate over a copy of the original child nodes
  const childNodes = Array.from(node.childNodes);
  childNodes.forEach((child: Node) => {
    // TODO: Explicitly ignoring paragraphs and blockquotes in list elements
    if (immediateComponents.indexOf(child.nodeName) >= 0) {
      const leftOutput = processSubtree(
        Array.from(node.childNodes).slice(
          // TODO: Should only ever have one left-hand sibling that should be processed?
          0,
          Array.prototype.indexOf.call(node.childNodes, child),
        ),
        child.parentNode.nodeName,
      );
      if (leftOutput != null) {
        output.push(leftOutput);
        // Keep track of un-aggregated rows that need to be combined into one
        // Marticle*List component
        aggFrom = aggFrom ?? output.length - 1;
      }
      let currentNodeOutput = null;
      // Ignore nested list tags of the same type; we just need to count them for
      // row depth, but they can be the same Marticle*List component
      if (child.nodeName !== listType) {
        if (aggFrom != null) {
          // Aggregate row elements into one component before making a new one
          const aggOutput = output.splice(aggFrom);
          aggFrom = null; // Reset counter
          output.push({ __typeName: listTypeMap[listType], rows: aggOutput });
        }
        currentNodeOutput = processCurrentNode(child, article);
      }
      if (currentNodeOutput != null) {
        if (currentNodeOutput instanceof Array) {
          output = output.concat(currentNodeOutput);
        } else {
          output.push(currentNodeOutput);
        }
      }
    }
    ({ output, aggFrom } = listTransformer(
      child,
      output,
      listType,
      aggFrom,
      article,
    ));
    // Postorder traversal of a LI node that doesn't contain nesting
    // or another Marticle* component
    if (child.nodeName === 'LI') {
      const subtreeRes = processSubtree(
        Array.from(child.childNodes),
        child.nodeName,
      );
      if (subtreeRes != null) {
        output.push(subtreeRes);
        // When we revisit a list node, note we should aggregate if we
        // don't already have un-aggregated rows
        aggFrom = aggFrom ?? output.length - 1;
      }
    }
  });
  return { output, aggFrom };
}

/*
 * Fetches image/video for a specific image/image id from the parser API data
 * The comment passed to this function is in the format
 * format IMG_* for image and VIDEO_* for video
 * @param comment
 * @param media in Parser Api format - always contains 'src' value.
 */
function getParserMediaFromComment(
  comment: string,
  media: ParserMediaMap,
): SrcRecord | null {
  const mediaId = parseInt(comment.trim()?.split('_').pop());
  const mediaElement = media ? media[mediaId] : null;
  const hasValidSrc = (mediaElement: SrcRecord | null): boolean => {
    if (mediaElement == null) {
      return false;
    } else {
      // Only return if src is valid URL
      try {
        new URL(mediaElement.src);
      } catch (err) {
        return false;
      }
      return true;
    }
  };
  return hasValidSrc(mediaElement) ? mediaElement : null;
}

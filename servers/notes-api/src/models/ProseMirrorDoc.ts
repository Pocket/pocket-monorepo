import { Node, Schema } from 'prosemirror-model';
import { EditorState, AllSelection } from 'prosemirror-state';
import { findWrapping } from 'prosemirror-transform';
import {
  defaultMarkdownSerializer,
  defaultMarkdownParser,
  schema as commonMarkSchema,
} from 'prosemirror-markdown';
import { UserInputError } from '@pocket-tools/apollo-utils';
import { serverLogger } from '@pocket-tools/ts-logger';
import * as Sentry from '@sentry/node';

/**
 * Class for handling ProseMirror documents
 */
export class ProseMirrorDoc {
  public readonly document: Node;
  public readonly schema: Schema;
  constructor(jsonDoc: any, schema?: Schema) {
    this.schema = schema ?? commonMarkSchema;
    this.document = Node.fromJSON(this.schema, jsonDoc);
  }
  /**
   * Markdown preview of the document content.
   * For now, returns the entire document serialized
   * to [CommonMark](http://commonmark.org/), but will
   * truncate/edit the content in the future.
   */
  get preview() {
    return defaultMarkdownSerializer.serialize(this.document);
  }
  /**
   * Markdown representation of the document content.
   * Returns the document serialized
   * to [CommonMark](http://commonmark.org/).
   */
  get markdown() {
    return defaultMarkdownSerializer.serialize(this.document);
  }
}

/**
 * Create a new Prosemirror editor state from a markdown string.
 * If the string cannot be serialized into a markdown mark,
 * it will just be parsed as a string literal.
 */
export function docFromMarkdown(doc: string) {
  return defaultMarkdownParser.parse(doc);
}

/**
 * Wrap a JSON representation of a ProseMirror document in a blockquote,
 * optionally with an additional paragraph that references the source
 * link from where the document was copied.
 * Returns a JSON-serializable representation of the new formatted document.
 */
export function wrapDocInBlockQuote<
  S extends Schema<'blockquote' | 'paragraph' | 'text', 'link'>,
>(quoteDoc: any, options?: { source?: string; schema?: S }): any {
  const opts = options ?? {};
  Sentry.addBreadcrumb({
    message: 'wrapDocInBlockQuote: input document',
    type: 'log',
    timestamp: Date.now(),
    data: { source: opts.source, doc: quoteDoc },
  });
  const schema = opts.schema ?? commonMarkSchema;
  const source = opts.source;
  let initialState: EditorState;
  try {
    initialState = EditorState.create({ doc: Node.fromJSON(schema, quoteDoc) });
  } catch (error) {
    if (error instanceof RangeError) {
      serverLogger.warn({
        message: 'Attempted to parse document with unknown node type',
        errorData: error,
        document: quoteDoc,
      });
      throw new UserInputError(`Invalid Document: ${error.message}`);
    } else {
      throw error;
    }
  }
  // Kind of a silly closure, but helps keep this more organized
  // without having to pass along everything to a new function for
  // error reporting/logging
  const wrapDoc = (state: EditorState) => {
    // Logic for wrapping in blockquote
    const docSelect = new AllSelection(state.doc);
    const range = docSelect.$from.blockRange(docSelect.$to);
    if (range == null) {
      const message = `Could not generate range from document`;
      serverLogger.error({ message, document: quoteDoc, source });
      throw new UserInputError(`${message} -- is the document malformed?`);
    } else {
      const wrapping = findWrapping(range, schema.nodes.blockquote, {});
      if (wrapping == null) {
        const message = `Could not wrap document selection`;
        serverLogger.error({ message, document: quoteDoc, source });
        throw new UserInputError(`${message} -- is the document malformed?`);
      } else {
        const transaction = state.tr.wrap(range, wrapping);
        const trxResult = state.applyTransaction(transaction);
        return trxResult.state;
      }
    }
  };
  // Wrap document in blockquote
  const state = wrapDoc(initialState);
  // Insert paragraph with source link if provided
  if (source != null) {
    const node = schema.node('paragraph', {}, [
      schema.text('Source: '),
      schema.text(source, [schema.mark('link', { href: source })]),
    ]);
    const transaction = state.tr.insert(state.tr.doc.content.size, node);
    const trxResult = state.applyTransaction(transaction);
    return trxResult.state.doc.toJSON();
  } else {
    // Just return the blockquoted-doc
    return state.doc.toJSON();
  }
}

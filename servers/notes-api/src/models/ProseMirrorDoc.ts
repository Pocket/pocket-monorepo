import { Node, Schema } from 'prosemirror-model';
import {
  defaultMarkdownSerializer,
  defaultMarkdownParser,
  schema as commonMarkSchema,
} from 'prosemirror-markdown';

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

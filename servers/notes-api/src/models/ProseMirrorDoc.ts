import { Node, type Schema } from 'prosemirror-model';
import {
  defaultMarkdownSerializer,
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
}

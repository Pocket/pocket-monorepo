import { ForbiddenError } from '@pocket-tools/apollo-utils';
import { HighlightsDataService } from '../dataservices/highlights.ts';
import { NotesDataService } from '../dataservices/notes.ts';
import {
  BatchWriteHighlightsInput,
  BatchWriteHighlightsResult,
  Highlight,
  CreateHighlightInput,
  HighlightNote,
  UpdateHighlightInput,
  SavedItemAnnotations,
  CreateHighlightByUrlInput,
} from '../__generated__/resolvers-types.ts';
import { ParserAPI } from '../dataservices/parserApi.ts';

export class HighlightsModel {
  constructor(
    private highlightService: HighlightsDataService,
    private noteService: NotesDataService,
    private parserApi: ParserAPI,
    private userIsPremium: boolean,
  ) {}
  forbidden() {
    throw new ForbiddenError(
      'This feature is restricted to premium Pocket accounts',
    );
  }
  async getByItemId(itemId: string): Promise<SavedItemAnnotations> {
    const highlights = await this.highlightService.getByItemId(itemId);
    return { highlights };
  }
  async createOneByUrl(input: CreateHighlightByUrlInput): Promise<Highlight> {
    const itemId = await this.parserApi.getItemId(input.url.toString());
    const createById = { ...input, itemId };
    const result = await this.createMany([createById]);
    return result[0];
  }
  async createMany(input: CreateHighlightInput[]): Promise<Highlight[]> {
    const highlights = await this.highlightService.create(input);
    const noteData = input.reduce(
      (result, highlightInput, index) => {
        if (highlightInput.note) {
          result.push({
            id: highlights[index].id,
            text: highlightInput.note,
          });
        }
        return result;
      },
      [] as { id: string; text: string }[],
    );
    let notes: HighlightNote[];
    if (noteData.length > 0) {
      notes = await this.noteService.batchCreate(noteData);
    }
    const returnHighlights = highlights.map((item, index) => {
      const tmpReturn = { ...item };
      if (input[index].note) tmpReturn.note = notes[index] ?? undefined;
      return tmpReturn;
    });
    return returnHighlights;
  }
  async update(
    id: string,
    input: CreateHighlightInput | UpdateHighlightInput,
  ): Promise<Highlight> {
    await this.highlightService.update(id, input);
    return await this.highlightService.getById(id);
  }
  async delete(id: string): Promise<string> {
    const highlightId = await this.highlightService.delete(id);
    try {
      await this.noteService.delete(id);
    } catch {
      // This is ok to fail since a highlight can exist without a note
    }
    return highlightId;
  }
  async addNote(id: string, note: string): Promise<HighlightNote> {
    if (!this.userIsPremium) this.forbidden();
    // Checks for existence of highlight attempting to attach/update note to
    await this.highlightService.getById(id);
    return this.noteService.create(id, note);
  }
  async updateNote(id: string, note: string): Promise<HighlightNote> {
    if (!this.userIsPremium) this.forbidden();
    // Checks for existence of highlight attempting to attach/update note to
    await this.highlightService.getById(id);
    return this.noteService.upsert(id, note);
  }
  async deleteNote(id: string): Promise<string> {
    return this.noteService.delete(id);
  }
  async batchWrite(
    input: BatchWriteHighlightsInput,
  ): Promise<BatchWriteHighlightsResult> {
    return await this.highlightService.batchWrite(input);
  }
}

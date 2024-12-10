import { DB, JsonValue } from '../__generated__/db';
import { db } from '../datasources/db';
import { buildLexicographicWhere } from './Paginator';

describe('Pagination', () => {
  describe('lexicographic where', () => {
    type NoteSelectAll = {
      archived: boolean;
      createdAt: Date;
      deleted: boolean;
      docContent: JsonValue;
      id: number;
      noteId: string;
      sourceUrl: string | null;
      title: string | null;
      updatedAt: Date;
      userId: string;
    };
    const date = new Date(1733186596805);
    it('works with a single where value', () => {
      const qb = db.selectFrom('Note').selectAll();
      const lexQb = buildLexicographicWhere<DB, 'Note', NoteSelectAll, ['id']>(
        qb,
        { id: 1 },
        '>',
      );
      const res = lexQb.compile();
      const expectedSql = 'select * from "Note" where "id" > $1';
      expect(res.sql).toEqual(expectedSql);
      expect(res.parameters).toEqual([1]);
    });
    it('works with two where values', () => {
      const qb = db.selectFrom('Note').selectAll();
      const lexQb = buildLexicographicWhere<
        DB,
        'Note',
        NoteSelectAll,
        ['id', 'createdAt']
      >(qb, { id: 1, createdAt: date }, '>');
      const res = lexQb.compile();
      const expectedSql =
        'select * from "Note" where ("id" > $1 or ("createdAt" > $2 and "id" = $3))';
      expect(res.sql).toEqual(expectedSql);
      expect(res.parameters).toEqual([1, date, 1]);
    });
    it('works with three where values', () => {
      const qb = db.selectFrom('Note').selectAll();
      const lexQb = buildLexicographicWhere<
        DB,
        'Note',
        NoteSelectAll,
        ['id', 'createdAt', 'title']
      >(qb, { id: 1, createdAt: date, title: 'a' }, '>');
      const res = lexQb.compile();
      const expectedSql =
        'select * from "Note" where ("id" > $1 or ("createdAt" > $2 and "id" = $3) or ("title" > $4 and "id" = $5 and "createdAt" = $6))';
      expect(res.sql).toEqual(expectedSql);
      expect(res.parameters).toEqual([1, date, 1, 'a', 1, date]);
    });
  });
});

import chai, { expect } from 'chai';
import { TagSaveAssociation, PocketSave, Tag } from '../types';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import * as tagModel from './tag';
import { strings } from 'locutus/php';
import { ContextManager, IContext } from '../server/context';
import { Knex } from 'knex';
import { TagDataService } from '../dataService';

const tagServiceResp: Tag[] = [
  { name: 'zebra', id: 'emVicmFfX3hwa3R4dGFneF9f' },
  { name: 'travel', id: 'dHJhdmVsX194cGt0eHRhZ3hfXw==' },
];

chai.use(deepEqualInAnyOrder);
describe('tag model', () => {
  describe('getSuggestedBySaveId', () => {
    beforeAll(() => {
      jest
        .spyOn(TagDataService.prototype, 'getSuggestedTags')
        .mockResolvedValue(tagServiceResp);
    });
    afterAll(() => {
      jest.restoreAllMocks();
    });
    it('premium user gets tags', async () => {
      let parent: PocketSave;
      const context: IContext = new ContextManager({
        request: {
          headers: { userid: '1', apiid: '0', premium: 'true' },
        },
        dbClient: jest.fn() as unknown as Knex,
        eventEmitter: null,
      });
      const resp = context.models.tag.getSuggestedBySaveId(parent);
      const data = await resp;
      return expect(data).to.deep.equal(tagServiceResp);
    });
    it('non-premium user gets no tags', async () => {
      let parent: PocketSave;
      const context: IContext = new ContextManager({
        request: {
          headers: { userid: '1', apiid: '0', premium: 'false' },
        },
        dbClient: jest.fn() as unknown as Knex,
        eventEmitter: null,
      });
      const resp = context.models.tag.getSuggestedBySaveId(parent);
      const data = await resp;
      return expect(data).to.deep.equal([]);
    });
  });
  describe('id', () => {
    it('should encode name + suffix into an id', () => {
      const expected = 'Y2FsZXZpX194cGt0eHRhZ3hfXw==';
      expect(tagModel.TagModel.encodeId('calevi')).to.equal(expected);
    });
    it('should encode an empty name to make an id', () => {
      const expected = 'X194cGt0eHRhZ3hfXw==';
      expect(tagModel.TagModel.encodeId('')).to.equal(expected);
    });
    it('should decode id and return name without suffix', () => {
      const id = 'c3l0YV9feHBrdHh0YWd4X18=';
      expect(tagModel.TagModel.decodeId(id)).to.equal('syta');
    });
    it('should decode id and return an empty string for empty tag', () => {
      const emptyTagId = 'X194cGt0eHRhZ3hfXw==';
      expect(tagModel.TagModel.decodeId(emptyTagId)).to.equal('');
    });
    it('should decode properly if the client passes an ID without the suffix (e.g. unsynced)', () => {
      const id = 'bGVl';
      expect(tagModel.TagModel.decodeId(id)).to.equal('lee');
    });
  });
  describe('deduplicateInput', () => {
    it('should remove duplicates', () => {
      const inputData: TagSaveAssociation[] = [
        { name: 'foam', savedItemId: '1' },
        { name: 'foam', savedItemId: '1' },
        { name: 'roller', savedItemId: '2' },
      ];
      const deduplicated = tagModel.deduplicateTagInput(inputData);
      expect(deduplicated.length).to.equal(2);
      expect(deduplicated).to.deep.equalInAnyOrder(inputData.slice(1));
    });
    it('should keep values that differ by only 1 key/value', () => {
      const inputData: TagSaveAssociation[] = [
        { name: 'foam', savedItemId: '1' },
        { name: 'foamy', savedItemId: '1' },
      ];
      const deduplicated = tagModel.deduplicateTagInput(inputData);
      expect(deduplicated.length).to.equal(2);
      expect(deduplicated).to.deep.equalInAnyOrder(inputData);
    });
  });
  describe('sanitizeTagSaveAssociation', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should shorten to 25 characters', () => {
      const cleaned = tagModel.sanitizeTagName(
        'let it be/ let it be/ let it be/ let it be/ speaking words of wisdom/ let it be',
      );
      expect(cleaned).to.equal('let it be/ let it be/ let');
    });
    it('should shorten without splitting emojis', () => {
      const tag =
        '\uD83D\uDEB4\u200D\u2640\uFE0F\uD83D\uDEB4\u200D\u2640\uFE0F\uD83D\uDEB4\u200D\u2640\uFE0F\uD83D\uDEB4\u200D\u2640\uFE0F';
      const cleaned = tagModel.sanitizeTagName(tag);
      expect(cleaned).to.equal(tag).and.to.equal('🚴‍♀️🚴‍♀️🚴‍♀️🚴‍♀️');
    });
    it('should lowercase where possible', () => {
      const cleaned = tagModel.sanitizeTagName('HÄÄÄÄ??');
      expect(cleaned).to.equal('hääää??');
      expect(tagModel.sanitizeTagName('统一码')).to.equal('统一码');
    });
    it('should replace the unicode object replacement character with "?"', () => {
      const cleaned = tagModel.sanitizeTagName('für Sarah\uFFFD');
      expect(cleaned).to.equal('für sarah?');
    });
    it('should trim whitespace', () => {
      const cleaned = tagModel.sanitizeTagName('       \n o h  ');
      expect(cleaned).to.equal('o h');
    });
    it('should use `addslashes`', () => {
      const addslashesSpy = jest.spyOn(strings, 'addslashes');
      const cleaned = tagModel.sanitizeTagName(`🤡-tdd-'is'\\"bug-free"-🤡`);
      expect(addslashesSpy.mock.calls.length).to.equal(1);
      expect(cleaned).to.equal(`🤡-tdd-\\'is\\'\\\\\\"bug-free\\"-🤡`);
    });
  });
});

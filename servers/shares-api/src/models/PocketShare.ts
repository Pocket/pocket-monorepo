import {
  PocketShare,
  ShareContextInput,
  ShareResult,
} from '../__generated__/types';
import {
  ISharesDataSource,
  ShareEntity,
  CreateShareEntity,
} from '../datasources/shares';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { UserContext } from './UserContext';

import { ShareNotFoundModel } from './ShareNotFoundModel';

export class PocketShareModel {
  constructor(
    private db: ISharesDataSource,
    private user: UserContext,
  ) {}
  /**
   * Convert input to DynamoDB entity
   */
  toEntity(target: URL, context?: ShareContextInput): CreateShareEntity {
    return {
      shareId: uuidv4(),
      targetUrl: target.toString(),
      createdAt: Math.round(Date.now() / 1000),
      ...(context?.note && { note: context.note }),
      ...(context?.highlights?.quotes.length && {
        highlights: context.highlights.quotes,
      }),
      ...this.user,
    };
  }
  /**
   * For update statement, convert to subset of DynamoDB fields
   */
  updateContextEntity(
    context: ShareContextInput,
  ): Pick<ShareEntity, 'note' | 'highlights'> {
    return {
      ...(context?.note != null && { note: context.note }),
      ...(context?.highlights?.quotes != null && {
        highlights: context.highlights.quotes,
      }),
    };
  }
  /**
   * Convert DynamoDB entity to GraphQL Type
   */
  fromEntity(entity: ShareEntity): PocketShare {
    const highlights = entity.highlights?.map((quote) => ({ quote }));
    return {
      __typename: 'PocketShare' as const,
      slug: entity.shareId,
      shareUrl: this.shareUrl(entity.shareId),
      targetUrl: entity.targetUrl,
      createdAt: new Date(entity.createdAt * 1000),
      context: {
        highlights: highlights.length ? highlights : undefined,
        note: entity.note,
      },
    };
  }
  /**
   * Build a share link from the shareId
   * @param shareId identifier for the share
   * @returns a url that can be used to resolve this share
   */
  private shareUrl(shareId: string) {
    return `${config.share.url}/${shareId}`;
  }
  /**
   * Create a new share link, optionally with additional
   * contextual data like highlighted text or notes
   * @param target the URL that is the subject of the share
   * @param context optional data with quotes and/or note(s)
   * @returns the share link that was created
   * @throws AuthenticationError if an anonymous user attempts
   * to make a Share (requires logged-in account)
   * @throws internal server error if link could not be created
   */
  async createShareLink(
    target: URL,
    context: ShareContextInput,
  ): Promise<PocketShare> {
    const input = this.toEntity(target, context);
    const res = await this.db.createShare(input);
    if (res instanceof Error) {
      throw res;
    }
    return this.fromEntity(res);
  }
  /**
   * Update the context added to a share (the highlighted quotes or note).
   * Overrwrites existing data if it exists.
   * Requires that the owner matches the value stored in the database
   * referenced by the passed owner key (e.g. guid).
   * The calling function should ensure that at least one key in
   * the `context` argument exists and contains data (not null/undefined).
   * Otherwise this function will fail.
   * @param shareId the key of the share to update
   * @param context the context to attach to the share (quotes, note)
   * @returns the updated ShareEntity if successful,
   * or a message indicating that the record is not found/owned by the user
   */
  async updateShareContext(
    shareId: string,
    context: ShareContextInput,
  ): Promise<ShareResult> {
    const contextEntity = this.updateContextEntity(context);
    const owner = { key: 'guid' as const, value: this.user.guid };
    const res = await this.db.updateShareContext(shareId, contextEntity, owner);
    if (res instanceof Error) {
      throw res;
    } else if (res != null) {
      return this.fromEntity(res);
    } else return ShareNotFoundModel;
  }
  /**
   * Look up a share record by the URL slug
   * @param slug URL path identifier
   * @returns ShareResult a PocketShare if the record
   * exists, or message indicating that the record is not found
   */
  async shareSlug(slug: string): Promise<ShareResult> {
    const res = await this.db.getShare(slug);
    if (res != null) {
      return this.fromEntity(res);
    }
    return ShareNotFoundModel;
  }
}

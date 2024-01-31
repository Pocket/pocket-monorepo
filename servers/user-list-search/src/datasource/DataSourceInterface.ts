export enum ListItemStatus {
  QUEUED = 0,
  ARCHIVED = 1,
  //Add more statuses.
}

export const listItemStatusToString = (
  listItemStatus: ListItemStatus
): string => {
  switch (listItemStatus) {
    case ListItemStatus.QUEUED:
      return 'queued';
    case ListItemStatus.ARCHIVED:
      return 'archived';
    default:
      throw new Error(`unhandled status: ${listItemStatus}`);
  }
};

export type BaseListItem = {
  userId: number;
  itemId: number;
};

export type ListItem = BaseListItem & {
  status: ListItemStatus;
  favorite: boolean;
  givenUrl: string;
  tags: string[];
  createdAt: Date;
};

export type ListItemEnriched = ListItem & {
  item: ParserItem;
};

// TODO: use proper types instead of any
export type ParserItem = {
  itemId: number;
  normalUrl: string;
  title: string;
  excerpt: string;
  // images?: any;
  isArticle: boolean;
  hasVideo: boolean;
  hasImage: boolean;
  resolvedId: number;
  authors?: string[];
  // article?: any;
  publishedAt: Date | null;
  domainId: number;
  wordCount: number;
  lang: string;
  //Item content may not exist. Because data.
  content?: string;
};

export type ItemMap = {
  [key: string]: ParserItem;
};

export interface DataSourceInterface {
  /**
   * Gets item data for the given item ids
   * @param itemIds
   */
  getItems(itemIds: number[]): Promise<ItemMap>;

  /**
   * Gets user's item ids
   * @param userId
   */
  getUserItemIds(userId: number): Promise<number[]>;

  /**
   * Checks if a user is premium
   * @param userId
   */
  isUserPremium(userId: number): Promise<boolean>;

  /**
   * Gets user's list items
   * @param userId
   * @param itemIds
   */
  getUserListItems(userId: number, itemIds: number[]): Promise<ListItem[]>;

  /**
   * Gets all premium user ids
   */
  getPremiumUserIds(): Promise<number[]>;
}

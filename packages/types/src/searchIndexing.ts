export type UserItemsSqsMessage = {
  userItems: {
    userId: number;
    itemIds: number[];
  }[];
};

export type UserListImportSqsMessage = {
  users: {
    userId: number;
  }[];
};

export type UserSearchIndexSqsMessage =
  | UserItemsSqsMessage
  | UserListImportSqsMessage;

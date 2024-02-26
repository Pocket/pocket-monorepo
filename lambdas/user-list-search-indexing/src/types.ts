//Dupe of types from user-list-search-sq-to-kinesis.. may be worthwile to make this a package..

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
  
  export type SqsMessage = UserItemsSqsMessage | UserListImportSqsMessage;
  
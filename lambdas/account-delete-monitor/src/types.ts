type OptionalExpiring = {
  expiresAt?: number;
};

export type MergedModel = OptionalExpiring & {
  // Destination userId + _merged
  id: string;
  // The userId that was merged into destination account
  sourceIds: Set<string>;
};

export type DeleteRequestModel = OptionalExpiring & {
  // userId + _request
  id: string;
  // The user's email, as a secondary identifier
  email: string;
  // ISO-formatted date (to use for index, querying records by date)
  date: string;
  // ISO Format
  timestamp: string;
};

export type UserMergeEvent = {
  destinationUserId: string;
  sourceUserId: string;
};

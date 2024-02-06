export type ProspectEventBridgePayload = {
  detail: Prospect;
  source: 'prospect-events' | string;
  'detail-type': EventType;
};

export type EventType = 'prospect-dismiss';

export type Prospect = {
  // a GUID we generate prior to inserting into dynamo
  id: string;
  // the prospect ID supplied by ML
  prospectId: string;
  scheduledSurfaceGuid: string;
  topic?: string;
  prospectType: string;
  url: string;
  saveCount: number;
  rank: number;
  curated?: boolean;
  // unix timestamp
  createdAt?: number;
  domain?: string;
  excerpt?: string;
  imageUrl?: string;
  language?: string;
  publisher?: string;
  title?: string;
  isSyndicated?: boolean;
  isCollection?: boolean;
  // authors will be a comma separated string
  authors?: string;
  approvedCorpusItem?: { url: string };
  rejectedCorpusItem?: { url: string };
  prospectReviewStatus: ProspectReviewStatus;
  // The LDAP string of the curator who reviewed this prospect - for now, only dismissing prospect.
  reviewedBy?: string;
  // The Unix timestamp in seconds.
  reviewedAt?: number;
};

export enum ProspectReviewStatus {
  Created = 'created',
  Recommendation = 'recommendation',
  Corpus = 'corpus',
  Rejected = 'rejected',
  Dismissed = 'dismissed',
}

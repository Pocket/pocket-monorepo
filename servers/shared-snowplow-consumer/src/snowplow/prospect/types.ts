import { ObjectUpdateTrigger } from '../../snowtype/snowplow';

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

export type BasicProspectEventPayloadWithContext = {
  object_version: string;
  prospect: Prospect;
};

export type EventTypeString = keyof typeof EventType;

export type ProspectEventPayloadSnowplow =
  BasicProspectEventPayloadWithContext & {
    eventType: EventTypeString;
  };

export type SnowplowEventType = 'prospect_reviewed';

export const SnowplowEventMap: Record<EventTypeString, ObjectUpdateTrigger> = {
  PROSPECT_REVIEWED: 'prospect_reviewed',
};

//snowplow event type
export enum EventType {
  PROSPECT_REVIEWED = 'PROSPECT_REVIEWED',
}

export enum ProspectReviewStatus {
  Created = 'created',
  Recommendation = 'recommendation',
  Corpus = 'corpus',
  Rejected = 'rejected',
  Dismissed = 'dismissed',
}

import { Prospect, ProspectReviewStatus } from '@pocket-tools/event-bridge';

export const testProspectData: Prospect = {
  // a GUID we generate prior to inserting into dynamo
  id: '123-abc',
  // the prospect ID supplied by ML
  prospectId: 'cde-456',
  scheduledSurfaceGuid: 'NEW_TAB_EN_US',
  topic: 'PERSONAL_FINANCE',
  prospectType: 'SYNDICATED_NEW',
  url: 'https://www.test.com/story',
  saveCount: 111,
  rank: 1,
  curated: true,
  // unix timestamp
  createdAt: 1665550000,
  domain: 'test.com',
  excerpt: 'A story to show all stories what stories are about',
  imageUrl: 'https://www.test.com/story/hero-image.jpg',
  language: 'EN',
  publisher: 'Test.com',
  title: 'A tale of two cities',
  isSyndicated: true,
  isCollection: false,
  authors: 'Charles Dickens, Mark Twain',
  prospectReviewStatus: ProspectReviewStatus.DISMISSED,
  // The LDAP string of the curator who reviewed this prospect - for now, only dismissing prospect.
  reviewedBy: 'user|ldap',
  // The Unix timestamp in seconds.
  reviewedAt: 1665550001,
};

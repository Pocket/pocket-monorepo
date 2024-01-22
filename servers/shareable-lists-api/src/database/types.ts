import { Visibility, ModerationStatus, Prisma } from '@prisma/client';

/**
 * Source of truth: https://getpocket.atlassian.net/wiki/spaces/PE/pages/2584150049/Pocket+Shared+Data
 */
export enum ShareableListModerationReason {
  ABUSIVE_BEHAVIOR = 'ABUSIVE_BEHAVIOR',
  POSTING_PRIVATE_INFORMATION = 'POSTING_PRIVATE_INFORMATION',
  HATE_SPEECH = 'HATE_SPEECH',
  MISLEADING_INFORMATION = 'MISLEADING_INFORMATION',
  ADULT_SEXUAL_CONTENT = 'ADULT_SEXUAL_CONTENT',
  CSAM_IMAGES = 'CSAM_IMAGES',
  CSAM_SOLICITATION = 'CSAM_SOLICITATION',
  ILLEGAL_GOODS_AND_SERVICES = 'ILLEGAL_GOODS_AND_SERVICES',
  VIOLENCE_AND_GORE = 'VIOLENCE_AND_GORE',
  INSTRUCTIONS_FOR_VIOLENCE = 'INSTRUCTIONS_FOR_VIOLENCE',
  INCITEMENT_TO_VIOLENCE = 'INCITEMENT_TO_VIOLENCE',
  SELF_HARM = 'SELF_HARM',
  TERRORISM = 'TERRORISM',
  COPYRIGHT = 'COPYRIGHT',
  TRADEMARK = 'TRADEMARK',
  COUNTERFEIT = 'COUNTERFEIT',
  SPAM = 'SPAM',
  FRAUD = 'FRAUD',
  MALWARE = 'MALWARE',
  PHISHING = 'PHISHING',
}

/**
 * These are the properties of list items exposed on both the Public and Admin graphs.
 *
 * New and improved way of setting up custom types that contain a subset of Prisma
 * model properties while taking advantage of Prisma validation and type safety.
 * (see more at https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety/operating-against-partial-structures-of-model-types)
 *
 * TODO: remove all Parser related metadata - https://getpocket.atlassian.net/browse/OSL-496 + remove ShareableListItemTemp type.
 */
export const shareableListItemSelectFields =
  Prisma.validator<Prisma.ListItemSelect>()({
    externalId: true,
    itemId: true,
    url: true,
    title: true,
    excerpt: true,
    note: true,
    imageUrl: true,
    publisher: true,
    authors: true,
    sortOrder: true,
    createdAt: true,
    updatedAt: true,
  });

const shareableListItem = Prisma.validator<Prisma.ListItemArgs>()({
  select: shareableListItemSelectFields,
});
export type ShareableListItem = Prisma.ListItemGetPayload<
  typeof shareableListItem
>;

/**
 * Setting up the temp shareable list item type without Parser metadata.
 * Once Parser metata is removed from the db and code, switch back to the original
 * type definition and delete this type definition.
 */
// export const shareableListItemSelectFieldsTemp =
//   Prisma.validator<Prisma.ListItemSelect>()({
//     externalId: true,
//     itemId: true,
//     url: true,
//     note: true,
//     sortOrder: true,
//     createdAt: true,
//     updatedAt: true,
//   });
// const shareableListItemTemp = Prisma.validator<Prisma.ListItemArgs>()({
//   select: shareableListItemSelectFieldsTemp,
// });
// export type ShareableListItemTemp = Prisma.ListItemGetPayload<
//   typeof shareableListItemTemp
// >;

/**
 * This is the shape of a shareable list object on the public Pocket Graph -
 * properties meant for the Admin Graph are omitted.
 *
 * Note that the included list items also pull in a subset of properties
 * for the types to match.
 */
const shareableListSelectFields = {
  externalId: true,
  userId: true,
  slug: true,
  title: true,
  description: true,
  status: true,
  moderationStatus: true,
  createdAt: true,
  updatedAt: true,
  listItems: { select: shareableListItemSelectFields },
  listItemNoteVisibility: true,
};
const shareableList = Prisma.validator<Prisma.ListArgs>()({
  select: shareableListSelectFields,
});
export type ShareableList = Prisma.ListGetPayload<typeof shareableList>;

/**
 * This is the shape of a shareable list object on the Admin Pocket Graph:
 * the public list + additional props meant for the moderators' eyes only.
 */
const shareableListCompleteSelectFields = {
  ...shareableListSelectFields,
  moderatedBy: true,
  moderationReason: true,
  moderationDetails: true,
  restorationReason: true,
};
const shareableListComplete = Prisma.validator<Prisma.ListArgs>()({
  select: shareableListCompleteSelectFields,
});
export type ShareableListComplete = Prisma.ListGetPayload<
  typeof shareableListComplete
>;

export type CreateShareableListInput = {
  title: string;
  description?: string;
  listItem?: CreateShareableListItemInput;
  listItemNoteVisibility?: Visibility;
};

export type UpdateShareableListInput = {
  externalId: string;
  title?: string;
  description?: string;
  status?: Visibility;
  listItemNoteVisibility?: Visibility;
  // Not in the public schema but here in the DB input type
  // because it's generated in the DB resolver if required.
  slug?: string;
  // Also not in the public schema, but here because the value needs to be set
  // in the resolver.
  updatedAt?: string;
};

export type ModerateShareableListInput = {
  externalId: string;
  moderationStatus: ModerationStatus;
  // optional here, but enforced on the front-end
  moderationReason?: ShareableListModerationReason;
  moderationDetails?: string;
  restorationReason?: string;
  // not in the schema, copied from the request user data when updating
  moderatedBy: string;
};

export type CreateShareableListItemInput = {
  listExternalId: string;
  itemId: string;
  url: string;
  title?: string;
  excerpt?: string;
  note?: string;
  imageUrl?: string;
  publisher?: string;
  authors?: string;
  sortOrder: number;
};

/**
 * Input for updating a single shareable list item
 */
export type UpdateShareableListItemInput = {
  externalId: string;
  note?: string;
  sortOrder?: number;
};

/**
 * Input for updating an array of shareable list items
 */
export type UpdateShareableListItemsInput = {
  externalId: string;
  sortOrder: number;
};

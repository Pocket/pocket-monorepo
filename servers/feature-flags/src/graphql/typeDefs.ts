import path from 'path';
import fs from 'fs';
import { gql } from 'graphql-tag';
import { Context, Properties } from 'unleash-client/lib/context';

/**
 * Any updates to the types in this file also need to be reflected in the schema.gql.
 * They should remain the same
 */

/**
 * Extends the unleash node client's Context type.
 * Mainly to add documentation
 */
export type UnleashContext = Context & {
  //Information about the user and device. Based on https://unleash.github.io/docs/unleash_context
  //Used to calculate assignment values.
  appName: string;
  environment: string;
  userId?: string; // If logged in, the user's encoded user id (uid). The {Account.user_id}.
  sessionId: string; // A device specific identifier that will be consistent across sessions, typically the encoded {guid} or some session token.
  remoteAddress?: string; // The device's ip address. Can be excluded in most cases since the server can detect it.
  properties?: UnleashProperties;
};

export interface RecItUserProfile {
  userModels: string[];
}

/**
 * Extends the unleash node client's Properties type.
 * Mainly to specific declared properties we have
 */
export type UnleashProperties = Properties & {
  locale?: string;
  accountCreatedAt?: string;
  // Unleash only allows properties to be strings or numbers.
  // - In the input to the GraphQL resolver recItUserProfile matches the RecItUserProfile interface.
  // - In the request to Unleash recItUserProfile is a JSON-encoded string of this object.
  recItUserProfile?: string;
  //If we want to add more properties to Unleash as inputs, this is the place to do it.
};

/**
 * Represents a Pocket Unleash Assignment
 */
export type UnleashAssignment = {
  // Details on the variant/status of this toggle for a given user/context
  name: string; // The unleash toggle name, the same name as it appears in the admin interface and feature api
  assigned: boolean; // Whether or not the provided context is assigned
  variant?: string; // If the toggle has variants, the variant name it is assigned to
  payload?: string; // If the variant has a payload, its payload value
};

export type UnleashAssignmentList = {
  assignments: UnleashAssignment[];
};

export const typeDefs = gql(
  fs.readFileSync(path.join(__dirname, '..', '..', 'schema.graphql')).toString()
);

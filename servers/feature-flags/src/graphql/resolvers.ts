import { RequestHandlerContext } from './index.js';
import {
  UnleashAssignment,
  UnleashAssignmentList,
  UnleashContext,
  UnleashProperties,
} from './typeDefs.js';
import { getUnleashClient } from '../unleashClient/index.js';
import { Unleash } from 'unleash-client';
import { FeatureInterface } from 'unleash-client/lib/feature.js';

/**
 * Given an input, and the base express data, create unleash assignments
 * @param input
 * @param requestHandlerContext
 */
const getAssignments = async (
  input: UnleashContext,
  requestHandlerContext: RequestHandlerContext,
) => {
  // honor explicit remoteAddress, otherwise use in the following order:
  // * IP forwarded from the web repo
  // * the forwarded ip in the request header
  // * finally request.ip
  input.remoteAddress =
    input.remoteAddress ??
    requestHandlerContext.forwardedIp ??
    requestHandlerContext.ip;

  const properties: UnleashProperties = input.properties ?? {};
  properties.locale = properties.locale ?? requestHandlerContext.locale;

  // Unleash only accepts string|number|undefined as property values. (See node_modules/unleash-client/lib/context.d.ts)
  // Therefore we JSON-encode the userProfile if it's available.
  if (properties.recItUserProfile) {
    properties.recItUserProfile = JSON.stringify(properties.recItUserProfile);
  }

  input.properties = properties;

  const unleashClient = getUnleashClient();
  const assignments = convertToUnleashAssignment(
    unleashClient,
    unleashClient.getFeatureToggleDefinitions(),
    input,
  );
  return assignments;
};

/**
 * Convert a response from the unleash node client to our Pocket UnleashAssignment
 * @param instance
 * @param toggles
 * @param context
 * @return UnleashAssignment[]
 */
const convertToUnleashAssignment = (
  instance: Unleash,
  toggles: FeatureInterface[],
  context: UnleashContext,
): UnleashAssignment[] => {
  return toggles.map((toggle: FeatureInterface) => {
    // Unleash in a recent update returns null or an empty array for variants in the API response
    // We need to check for both
    if (
      !toggle.variants ||
      (toggle.variants instanceof Array && toggle.variants.length === 0)
    ) {
      return {
        name: toggle.name,
        assigned: instance.isEnabled(toggle.name, context),
      };
    }

    const { enabled, name, payload } = instance.getVariant(
      toggle.name,
      context,
    );

    return {
      name: toggle.name,
      assigned: enabled,
      variant: name,
      payload: payload?.value,
    };
  });
};

/**
 * The Apollo resolvers for our graphql schema.
 */
export const resolvers = {
  // Custom scalar
  Query: {
    getUnleashAssignments: async (
      // we ignore the any types here because we do not know the graphql resolver types
      parent: any, // eslint-disable-line
      args: any, // eslint-disable-line
      context: RequestHandlerContext,
    ): Promise<UnleashAssignmentList> => {
      return {
        //Pull out the user inputted data from the args
        assignments: await getAssignments(args.context, context),
      };
    },
    unleashAssignments: async (
      // we ignore the any types here because we do not know the graphql resolver types
      parent: any, // eslint-disable-line
      args: any, // eslint-disable-line
      context: RequestHandlerContext,
    ): Promise<UnleashAssignmentList> => {
      return {
        //Pull out the user inputted data from the args
        assignments: await getAssignments(args.context, context),
      };
    },
  },
};

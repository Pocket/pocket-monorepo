import { RequestHandlerContext } from './index';
import {
  UnleashAssignment,
  UnleashAssignmentList,
  UnleashContext,
  UnleashProperties,
} from './typeDefs';
import { getUnleashClient } from '../unleashClient';
import { Unleash } from 'unleash-client';
import { FeatureInterface } from 'unleash-client/lib/feature';

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
    const variant = instance.forceGetVariant(toggle.name, context);

    if (!variant || variant.name == 'disabled') {
      return {
        name: toggle.name,
        assigned: instance.isEnabled(toggle.name, context),
      };
    }

    return {
      name: toggle.name,
      assigned: variant.enabled,
      variant: variant.name,
      payload: variant.payload.value,
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
      parent: any,
      args: any,
      context: RequestHandlerContext,
    ): Promise<UnleashAssignmentList> => {
      return {
        //Pull out the user inputted data from the args
        assignments: await getAssignments(args.context, context),
      };
    },
    unleashAssignments: async (
      // we ignore the any types here because we do not know the graphql resolver types
      parent: any,
      args: any,
      context: RequestHandlerContext,
    ): Promise<UnleashAssignmentList> => {
      return {
        //Pull out the user inputted data from the args
        assignments: await getAssignments(args.context, context),
      };
    },
  },
};

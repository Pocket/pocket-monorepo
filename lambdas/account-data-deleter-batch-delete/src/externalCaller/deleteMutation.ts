import { backOff } from 'exponential-backoff';
import fetch from 'node-fetch';
import { config } from '../config';

/**
 * Function that establishes the number of back off attempts
 * and calls the deleteUser mutation function. Catches and throws any errors
 * as well as errors thrown by the mutation call
 *
 * @param userId Id whose PII will be deleted
 * @returns userId Id for which the PII delete was successfully initiated
 */
export async function deleteUserMutationCaller(
  userId: string,
): Promise<string> {
  const backOffOptions = {
    numOfAttempts: config.retryLimit,
  };

  const res = await backOff(
    () => userApiCalls.deleteUserMutation(userId),
    backOffOptions,
  );
  if (res.errors != null) {
    throw new Error(
      `Error calling deleteUser mutation.\n GraphQL Errors: ${JSON.stringify(
        res.errors,
      )}`,
    );
  }

  return res.data['deleteUser'];
}

/**
 * Calls the deleteUser mutation.
 * wrapped in object for stubbing in test.
 * @param userId id of the pocket account whose PII will be deleted.
 * @returns json response of the deleteUser mutation
 */
export const userApiCalls = {
  deleteUserMutation: async (userId: string): Promise<any> => {
    const DELETE_USER = `
      mutation deleteUser {
          deleteUser
      }
  `;

    const res = await fetch(config.userApi, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        userid: userId.toString(),
        apiid: '0', //as default api-id
      },
      body: JSON.stringify({ query: DELETE_USER }),
    });

    return await res.json();
  },
};

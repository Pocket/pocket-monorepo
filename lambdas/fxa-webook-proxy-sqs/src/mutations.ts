import fetch from 'node-fetch';

import { SQSRecord } from 'aws-lambda';

import config from './config';
import { getFxaPrivateKey } from './secretManager';
import { generateJwt } from './jwt';
import { FxaEvent } from '.';

// should match the reasons defined in user-api subgraph schema:
// https://github.com/Pocket/user-api/blob/main/schema.graphql#L69
enum ExpireUserWebSessionReason {
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  LOGOUT = 'LOGOUT',
}

/**
 * If a request to client-api was made, handle any potential errors
 * @param record SQS record
 * @param fxaEvent FxaEvent
 * @param res response from client-api
 */
export function handleMutationErrors(
  record: SQSRecord,
  fxaEvent: FxaEvent,
  res?: any
) {
  if (res?.errors) {
    const hasNotFoundError = res.errors.filter(
      (error) => error.extensions?.code === 'NOT_FOUND'
    );
    if (hasNotFoundError.length) {
      console.info('FxA User not found', {
        userId: fxaEvent.user_id,
        event: fxaEvent,
      });
    } else {
      throw new Error(
        `Error processing ${record.body}: \n${JSON.stringify(res?.errors)}`
      );
    }
  }
}

/**
 * Submit deleteUserByFxaId mutation POST request to client-api
 * @param id FxA account ID to delete from Pocket's database
 */
export async function submitDeleteMutation(id: string): Promise<any> {
  const privateKey = await getFxaPrivateKey();

  const deleteMutation = `
  mutation deleteUser($id: ID!) {
    deleteUserByFxaId(id: $id)
  }`;

  const variables = { id: id };

  return await fetch(config.clientApiUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${generateJwt(privateKey, id)}`,
    },
    body: JSON.stringify({ query: deleteMutation, variables }),
  }).then((response) => response.json());
}

/**
 * Submit migrateAppleUser mutation POST request to client-api
 * @param id FxA account ID to delete from Pocket's database
 * @param email User email in the Fx event payload
 * @param transferSub primary ID connecting fxa account and pocket account
 */
export async function migrateAppleUserMutation(
  id: string,
  email: string,
  transferSub: string
): Promise<any> {
  const privateKey = await getFxaPrivateKey();

  const migrateAppleUser = `
  mutation migrateAppleUser($fxaId: ID!, $email: String!) {
    migrateAppleUser(fxaId: $fxaId, email: $email)
  }`;

  const variables = { fxaId: id, email: email };

  return await fetch(config.clientApiUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${generateJwt(privateKey, id)}`,
      transfersub: transferSub,
    },
    body: JSON.stringify({ query: migrateAppleUser, variables }),
  }).then((response) => response.json());
}

/**
 * Submit UpdateUserEmailByFxaId mutation POST request to client-api
 * This function is called when a PROFILE_UPDATE event is received with an email in its payload
 * @param id FxA account ID
 * @param email User email in the Fx event payload
 */
export async function submitEmailUpdatedMutation(
  id: string,
  email: string
): Promise<any> {
  const privateKey = await getFxaPrivateKey();

  const updateUserEmailMutation = `mutation UpdateUserEmailByFxaId($id: ID!, $email: String!) {updateUserEmailByFxaId(id: $id, email: $email) {
      email
    }
  }`;

  const variables = { id, email };

  return await fetch(config.clientApiUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${generateJwt(privateKey, id)}`,
    },
    body: JSON.stringify({ query: updateUserEmailMutation, variables }),
  }).then((response) => response.json());
}

/**
 * Submit ExpireWebSessionByFxaId mutation POST request to client-api
 * This function is called when a PASSWORD_CHANGE event is received
 * @param id FxA account ID
 */
export async function passwordChangeMutation(id: string): Promise<any> {
  const privateKey = await getFxaPrivateKey();

  const expireUserWebSessionByFxaId = `
    mutation ExpireUserWebSessionByFxaId($id: ID!, $reason: ExpireUserWebSessionReason!) {
      expireUserWebSessionByFxaId(
        id: $id,
        reason: $reason
      )
    }`;

  const variables = { id, reason: ExpireUserWebSessionReason.PASSWORD_CHANGED };

  return await fetch(config.clientApiUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${generateJwt(privateKey, id)}`,
    },
    body: JSON.stringify({ query: expireUserWebSessionByFxaId, variables }),
  }).then((response) => response.json());
}

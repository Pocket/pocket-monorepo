import { NimbusEventPayload, UserDataPayload } from './payloads';
import { PocketUser } from '../jwtUtils';

export interface PayloadInput {
  request: InboundRequest;
  pocketUser: PocketUser;
}

/**
 * NB: This type isn't or shouldn't be needed I think. IContext doesn't type its
 * requests (which I think are either http.IncomingMessage or Express.Request).
 * It seemed right to be more typesafe here, so I went with an approach that bound
 * to minimum expectations, which, right now, is just headers. There is most likely
 * a better way to do this but this was the dumbest way to get more typesafe.
 */
export interface InboundRequest {
  headers: Record<string, string | string[]>;
}

/**
 *
 * @param input: PayloadInput { request: InboundRequest, pocketUser: pocketUser }
 * @return NimbusEventPayload
 * @throws TypeError: If no guid in the PocketUser
 */
export function makePayload(input: PayloadInput): NimbusEventPayload {
  const { request, pocketUser } = input;
  if (!pocketUser.guid) {
    throw new TypeError(
      'Pocket User data missing guid, cannot construct NimbusPayload'
    );
  }
  const payload: NimbusEventPayload = {
    client_id: pocketUser.guid,
    context: {},
  };

  const val = stringOrFirstString(request.headers['web-request-language']);
  if (val) {
    payload.context.lang = val;
  }

  if (pocketUser?.consumerKey) {
    payload.context.consumer_key = pocketUser.consumerKey;
  }

  const user = makeUserPayload(pocketUser);
  if (user !== null) {
    payload.context.user = user;
  }
  return payload;
}

/**
 * Makes a UserDataPayload from a pocketUser. We don't send the user payload unless
 * it suffices all required fields, so return null in that case.
 *
 *
 * @param pocketUser
 * @returns a UserDataPayload when valid or null
 */
function makeUserPayload(pocketUser: PocketUser): UserDataPayload | null {
  // NB: There must be a better way to do this?
  switch (undefined) {
    case pocketUser.userId: //intentional fallthrough
    case pocketUser.email: //intentional fallthrough
    case pocketUser.premium:
      return null;
  }
  const userPayload: UserDataPayload = {
    user_id: pocketUser.userId,
    is_premium: pocketUser.premium,
    email_address: pocketUser.email,
  };
  return userPayload;
}

/**
 * Return a trimmed string when the input is truthy if the input is a string.
 * Also accepts string[] for multiple headers cases, using the first element.
 * @param header
 * @returns A string or false for falsey strings
 */
function stringOrFirstString(
  header: string | string[] | undefined | null
): string | false {
  if (!header) {
    // any kind of falsey string
    return false;
  }
  if (header instanceof Array) {
    header = header[0];
  }
  header = header.trim();
  if (header === '') {
    return false;
  } else {
    return header;
  }
}

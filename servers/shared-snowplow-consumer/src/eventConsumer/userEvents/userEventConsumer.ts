import { UserEventHandler } from '../../snowplow/user/userEventHandler';
import { UserEventBridgePaylod } from './types';

export function userEventConsumer(requestBody: UserEventBridgePaylod) {
  new UserEventHandler().process(requestBody);
}

// /**
//  * converts the event-bridge event format to snowplow payload
//  * @param eventObj event bridge event format
//  */
// export function getUserEventPayload(eventObj: any): UserEventPayloadSnowplow {
//   const eventPayload: UserEventPayload = eventObj['detail'];
//   const detailType = eventObj['detail-type'];

//   return {
//     user: {
//       id: eventPayload.userId,
//       email: eventPayload.email,
//       isPremium: eventPayload.isPremium ? true : false, //set as 0 in dev payload
//       hashedId: eventPayload.hashedId,
//       guid: eventPayload.guid,
//       hashedGuid: eventPayload.hashedGuid,
//     },
//     apiUser: {
//       apiId: eventPayload.apiId,
//       name: eventPayload.name,
//       isNative: eventPayload.isNative,
//       isTrusted: eventPayload.isTrusted,
//       clientVersion: eventPayload.clientVersion,
//     },
//     request: {
//       language: eventPayload.language,
//       snowplowDomainUserId: eventPayload.snowplowDomainUserId,
//       ipAddress: eventPayload.ipAddress,
//       userAgent: eventPayload.userAgent,
//     },
//     eventType: DetailTypeToSnowplowMap[detailType],
//   };
// }

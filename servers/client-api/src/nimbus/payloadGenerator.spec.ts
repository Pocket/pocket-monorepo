import { makePayload, PayloadInput } from './payloadGenerator';
import { NimbusEventPayload } from './payloads';

type TestInputs = [string, PayloadInput, NimbusEventPayload | Error];

const payloadCases: TestInputs[] = [
  [
    'Should contain at minimum client as long as we have a pocketUser',
    {
      request: { headers: <Record<string, string>>{} },
      pocketUser: {
        guid: '72fdep0VT853dq9110A757bn23gdI7495a5FsFqc94x16aL203120p27Y9cQJ386',
      },
    },
    {
      client_id:
        '72fdep0VT853dq9110A757bn23gdI7495a5FsFqc94x16aL203120p27Y9cQJ386',
      context: {},
    },
  ],
  [
    'Throws a TypeError if no sess_guid in the passed PocketUser',
    {
      request: { headers: <Record<string, string>>{} },
      pocketUser: {},
    },
    new TypeError(
      'Pocket User data missing guid, cannot construct NimbusPayload'
    ),
  ],
  [
    'Should grab all and only the appropriate fields from PocketUser/jwt',
    {
      request: { headers: <Record<string, string>>{} },
      pocketUser: {
        guid: '72fdep0VT853dq9110A757bn23gdI7495a5FsFqc94x16aL203120p27Y9cQJ386',
        premium: false,
        userId: '1234567',
        consumerKey: 'consumer',
        roles: ['we do not consume roles'],
        email: 'foo@bar.com',
      },
    },
    {
      client_id:
        '72fdep0VT853dq9110A757bn23gdI7495a5FsFqc94x16aL203120p27Y9cQJ386',
      context: {
        consumer_key: 'consumer',
        user: {
          user_id: '1234567',
          is_premium: false,
          email_address: 'foo@bar.com',
        },
      },
    },
  ],
  [
    'Includes the lang spec when we have it, and no other headers',
    {
      request: {
        headers: <Record<string, string>>{
          'web-request-language': 'en_US',
          'x-header-exclude': 'nada',
        },
      },
      pocketUser: {
        guid: '72fdep0VT853dq9110A757bn23gdI7495a5FsFqc94x16aL203120p27Y9cQJ386',
      },
    },
    {
      client_id:
        '72fdep0VT853dq9110A757bn23gdI7495a5FsFqc94x16aL203120p27Y9cQJ386',
      context: {
        lang: 'en_US',
      },
    },
  ],
];

describe('Test payload assembly', () => {
  test.each(payloadCases)('%#: %s', (_, input, expected) => {
    if (expected instanceof Error) {
      expect(() => {
        makePayload(input);
      }).toThrow(expected);
    } else {
      const payload = makePayload(input);
      expect(payload).toEqual(expected);
    }
  });
});

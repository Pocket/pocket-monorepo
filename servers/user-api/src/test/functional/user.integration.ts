import { readClient, writeClient } from '../../database/client';
import { gql } from 'graphql-tag';
import { UserDataService } from '../../dataService/userDataService';
import request from 'supertest';
import { print } from 'graphql';
import { startServer } from '../../apollo';
import {
  OauthUserAccessSeed,
  UserFirefoxAccountSeed,
  UserProfileSeed,
  UserSeed,
} from './seeds';

describe('User', () => {
  const getUserDataSpy: jest.SpyInstance = jest.spyOn(
    UserDataService.prototype,
    'getUserData',
  );

  const readDb = readClient();
  const writeDb = writeClient();
  let server;
  let app;
  let url;

  const accountBirthUser1 = new Date('March 25, 2015 2:00:30 PM GMT-07:00');
  const accountBirthUser2 = new Date('November 29, 2022 10:20:00 AM');

  const req = {
    headers: {
      token: 'access_token',
      apiId: '1',
      userid: '1',
    },
  };

  const req2 = {
    headers: {
      token: 'access_token',
      apiId: '2',
      userid: '2',
    },
  };

  const user1 = {
    user_id: 1,
    feed_id: '1',
    premium_status: 0,
    first_name: 'Pocket',
    last_name: 'User',
    birth: accountBirthUser1,
  };

  const user1Profile = {
    user_id: 1,
    username: 'username',
    name: 'Pocket User',
    description: 'my bio',
    avatar_url: 's3://my-avatar',
  };

  const user2 = {
    user_id: 2,
    feed_id: '2',
    premium_status: 1,
    first_name: '', // names are empty by default
    last_name: '',
    birth: accountBirthUser2,
  };

  const user2Profile = {
    user_id: 2,
    username: null, // username is null by default
    name: 'Second Pocket User',
    description: 'my bio',
    avatar_url: 's3://my-avatar-2',
  };

  afterAll(async () => {
    await readDb.destroy();
    await writeDb.destroy();
    server.stop();
  });
  afterEach(() => jest.clearAllMocks());

  beforeAll(async () => {
    ({ app, server, url } = await startServer(0));

    await writeDb('readitla_ril-tmp.user_firefox_account').truncate();
    await writeDb('readitla_ril-tmp.user_firefox_account').insert(
      UserFirefoxAccountSeed({
        user_id: 1,
        firefox_uid: 'abc1',
      }),
    );
    await writeDb('users').truncate();
    await writeDb('users').insert(
      [user1, user2].map((input) => UserSeed(input)),
    );
    await writeDb('user_profile').truncate();
    await writeDb('user_profile').insert(
      [user1Profile, user2Profile].map((input) => UserProfileSeed(input)),
    );
    await writeDb('oauth_user_access').truncate();
    await writeDb('oauth_user_access').insert(
      [
        {
          user_id: 1,
          consumer_key: 'consumer_key',
          access_token: 'access_token',
        },
        {
          user_id: 2,
          consumer_key: 'consume_key',
          access_token: 'access_token_2',
        },
      ].map((input) => OauthUserAccessSeed(input)),
    );
  });

  beforeEach(async () => {
    await writeDb('payment_subscriptions').truncate();
  });

  describe('getUser', () => {
    it('should only load data once, despite requesting all fields', async () => {
      const variables = {
        userId: '1',
      };

      const GET_USER = gql`
        query getUser {
          user {
            id
            username
            name
            firstName
            lastName
            description
            avatarUrl
            accountCreationDate
            isFxa
            premiumStatus
            premiumFeatures
          }
        }
      `;

      const res = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(GET_USER),
          variables,
        });

      expect(res.body.data?.user.id).toBe(
        'fb792e6e9DE6E3ecI3Ca1CaE49A08497Bc36eA3eD5AacCd0Ba3b1056DbaB89d5',
      );
      expect(res.body.data?.user.username).toBe('username');
      expect(res.body.data?.user.name).toBe('Pocket User');
      expect(res.body.data?.user.avatarUrl).toBe('s3://my-avatar');
      expect(res.body.data?.user.description).toBe('my bio');
      expect(res.body.data?.user.accountCreationDate).toBe(
        accountBirthUser1.toISOString(),
      );
      // user1 is also FxA so should be true
      expect(res.body.data?.user.isFxa).toBe(true);
      expect(res.body.data?.user.premiumStatus).toBe('NEVER');
      expect(res.body.data?.user.premiumFeatures).toBeNull();
      expect(getUserDataSpy).toHaveBeenCalledTimes(1);
    });

    it('isFxa should return false if user is not FxA', async () => {
      const variables = {
        userId: '2',
      };

      const GET_USER = gql`
        query getUser {
          user {
            id
            username
            name
            firstName
            lastName
            description
            avatarUrl
            accountCreationDate
            isFxa
          }
        }
      `;

      const res = await request(app)
        .post(url)
        .set(req2.headers)
        .send({
          query: print(GET_USER),
          variables,
        });

      expect(res.body.data?.user.name).toBe('Second Pocket User');
      expect(res.body.data?.user.avatarUrl).toBe('s3://my-avatar-2');
      expect(res.body.data?.user.description).toBe('my bio');
      // user2 is not FxA so should be false
      expect(res.body.data?.user.isFxa).toBe(false);
      expect(getUserDataSpy).toHaveBeenCalledTimes(1);
    });

    it('should not load data if data is provided from headers', async () => {
      const variables = {
        userId: '1',
      };

      const GET_USER = gql`
        query getUser {
          user {
            id
            isPremium
          }
        }
      `;
      const premiumHeaders = { premium: 'false', ...req.headers };
      const res = await request(app)
        .post(url)
        .set(premiumHeaders)
        .send({
          query: print(GET_USER),
          variables,
        });

      expect(res.body.data?.user.id).toBe(
        'fb792e6e9DE6E3ecI3Ca1CaE49A08497Bc36eA3eD5AacCd0Ba3b1056DbaB89d5',
      );
      expect(res.body.data?.user.isPremium).toBe(false);
      expect(getUserDataSpy).toHaveBeenCalledTimes(0);
    });
    it('should load data if not provided by headers', async () => {
      const variables = {
        userId: '1',
      };

      const GET_USER = gql`
        query getUser {
          user {
            id
            isPremium
          }
        }
      `;
      const res = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(GET_USER),
          variables,
        });

      expect(res.body.data?.user.id).toBe(
        'fb792e6e9DE6E3ecI3Ca1CaE49A08497Bc36eA3eD5AacCd0Ba3b1056DbaB89d5',
      );
      expect(res.body.data?.user.isPremium).toBe(false);
      expect(getUserDataSpy).toHaveBeenCalledTimes(1);
    });

    it('should load active subscription status', async () => {
      await writeDb('payment_subscriptions').insert([
        {
          user_id: 2,
          vendor_id: '12d3',
          product_id: 1,
          active: true,
          expires_at: new Date(new Date().getTime() + 1000000),
        },
        {
          user_id: 1,
          vendor_id: '123',
          product_id: 1,
          active: true,
          expires_at: new Date(),
        },
      ]);

      const variables = {
        userId: '1',
      };

      const GET_USER = gql`
        query getUser {
          user {
            id
            username
            name
            firstName
            lastName
            description
            avatarUrl
            accountCreationDate
            isFxa
            premiumStatus
            premiumFeatures
          }
        }
      `;

      const res = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(GET_USER),
          variables,
        });

      expect(res.body.data?.user.id).toBe(
        'fb792e6e9DE6E3ecI3Ca1CaE49A08497Bc36eA3eD5AacCd0Ba3b1056DbaB89d5',
      );
      expect(res.body.data?.user.username).toBe('username');
      expect(res.body.data?.user.name).toBe('Pocket User');
      expect(res.body.data?.user.avatarUrl).toBe('s3://my-avatar');
      expect(res.body.data?.user.description).toBe('my bio');
      expect(res.body.data?.user.accountCreationDate).toBe(
        accountBirthUser1.toISOString(),
      );
      // user1 is also FxA so should be true
      expect(res.body.data?.user.isFxa).toBe(true);
      expect(res.body.data?.user.premiumStatus).toBe('ACTIVE');
      expect(res.body.data?.user.premiumFeatures).toStrictEqual([
        'PERMANENT_LIBRARY',
        'SUGGESTED_TAGS',
        'PREMIUM_SEARCH',
        'ANNOTATIONS',
        'AD_FREE',
      ]);
      expect(getUserDataSpy).toHaveBeenCalledTimes(1);
    });

    it('should load active subscription status, when multiple have expired', async () => {
      await writeDb('payment_subscriptions').insert([
        {
          user_id: 1,
          vendor_id: '12d3',
          product_id: 1,
          active: false,
          expires_at: new Date(),
        },
        {
          user_id: 1,
          vendor_id: '12asd',
          product_id: 1,
          active: false,
          expires_at: new Date(),
        },
        {
          user_id: 12,
          vendor_id: '123',
          product_id: 1,
          active: false,
          expires_at: new Date(),
        },
        {
          user_id: 1,
          vendor_id: '123s',
          product_id: 1,
          active: true,
          expires_at: new Date(),
        },
      ]);

      const variables = {
        userId: '1',
      };

      const GET_USER = gql`
        query getUser {
          user {
            id
            username
            name
            firstName
            lastName
            description
            avatarUrl
            accountCreationDate
            isFxa
            premiumStatus
            premiumFeatures
          }
        }
      `;

      const res = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(GET_USER),
          variables,
        });

      expect(res.body.data?.user.id).toBe(
        'fb792e6e9DE6E3ecI3Ca1CaE49A08497Bc36eA3eD5AacCd0Ba3b1056DbaB89d5',
      );
      expect(res.body.data?.user.username).toBe('username');
      expect(res.body.data?.user.name).toBe('Pocket User');
      expect(res.body.data?.user.avatarUrl).toBe('s3://my-avatar');
      expect(res.body.data?.user.description).toBe('my bio');
      expect(res.body.data?.user.accountCreationDate).toBe(
        accountBirthUser1.toISOString(),
      );
      // user1 is also FxA so should be true
      expect(res.body.data?.user.isFxa).toBe(true);
      expect(res.body.data?.user.premiumStatus).toBe('ACTIVE');
      expect(res.body.data?.user.premiumFeatures).toStrictEqual([
        'PERMANENT_LIBRARY',
        'SUGGESTED_TAGS',
        'PREMIUM_SEARCH',
        'ANNOTATIONS',
        'AD_FREE',
      ]);
      expect(getUserDataSpy).toHaveBeenCalledTimes(1);
    });

    it('should load expire subscription status, when all have expired', async () => {
      await writeDb('payment_subscriptions').insert([
        {
          user_id: 2,
          vendor_id: '12d3',
          product_id: 1,
          active: true,
          expires_at: new Date(new Date().getTime() + 1000000),
        },
        {
          user_id: 1,
          vendor_id: '12d3',
          product_id: 1,
          active: false,
          expires_at: new Date(),
        },
        {
          user_id: 1,
          vendor_id: '12asd',
          product_id: 1,
          active: false,
          expires_at: new Date(),
        },
        {
          user_id: 12,
          vendor_id: '123',
          product_id: 1,
          active: false,
          expires_at: new Date(),
        },
        {
          user_id: 1,
          vendor_id: '123s',
          product_id: 1,
          active: false,
          expires_at: new Date(),
        },
      ]);

      const variables = {
        userId: '1',
      };

      const GET_USER = gql`
        query getUser {
          user {
            id
            username
            name
            firstName
            lastName
            description
            avatarUrl
            accountCreationDate
            isFxa
            premiumStatus
            premiumFeatures
          }
        }
      `;

      const res = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(GET_USER),
          variables,
        });

      expect(res.body.data?.user.id).toBe(
        'fb792e6e9DE6E3ecI3Ca1CaE49A08497Bc36eA3eD5AacCd0Ba3b1056DbaB89d5',
      );
      expect(res.body.data?.user.username).toBe('username');
      expect(res.body.data?.user.name).toBe('Pocket User');
      expect(res.body.data?.user.avatarUrl).toBe('s3://my-avatar');
      expect(res.body.data?.user.description).toBe('my bio');
      expect(res.body.data?.user.accountCreationDate).toBe(
        accountBirthUser1.toISOString(),
      );
      // user1 is also FxA so should be true
      expect(res.body.data?.user.isFxa).toBe(true);
      expect(res.body.data?.user.premiumStatus).toBe('EXPIRED');
      expect(res.body.data?.user.premiumFeatures).toBeNull();
      expect(getUserDataSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('referenceResolver', () => {
    const RESOLVE_REFERENCE = gql`
      query getUserByReference($id: ID!) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            name
            firstName
            lastName
            username
            avatarUrl
            accountCreationDate
          }
        }
      }
    `;

    const RESOLVE_REFERENCE_WITH_PRIVATE_PROP = gql`
      query getUserByReference($id: ID!) {
        _entities(representations: { id: $id, __typename: "User" }) {
          ... on User {
            name
            firstName
            lastName
            username
            avatarUrl
            isPremium
            accountCreationDate
          }
        }
      }
    `;
    it('should load the user requested by reference and not the user in the headers', async () => {
      const res = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(RESOLVE_REFERENCE),
          variables: {
            id: '2',
          },
        });

      expect(res.body).toHaveProperty(
        'data._entities[0].name',
        user2Profile.name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].firstName',
        user2.first_name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].lastName',
        user2.last_name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].username',
        user2Profile.username,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].avatarUrl',
        user2Profile.avatar_url,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].accountCreationDate',
        accountBirthUser2.toISOString(),
      );
    });

    it('should load the user requested by reference when no userId is sent in the headers', async () => {
      const res = await request(app)
        .post(url)
        .set({
          token: 'access_token',
          apiId: '1',
        })
        .send({
          query: print(RESOLVE_REFERENCE),
          variables: {
            id: '2',
          },
        });

      expect(res.body).toHaveProperty(
        'data._entities[0].name',
        user2Profile.name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].firstName',
        user2.first_name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].lastName',
        user2.last_name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].username',
        user2Profile.username,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].avatarUrl',
        user2Profile.avatar_url,
      );
      expect(res.body).toHaveProperty(
        'data._entities[0].accountCreationDate',
        accountBirthUser2.toISOString(),
      );
    });

    it('should forbid accessing private properties for users loaded via resolver reference with a different userId in headers', async () => {
      const res = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(RESOLVE_REFERENCE_WITH_PRIVATE_PROP),
          variables: {
            id: '2',
          },
        });

      expect(res.body).toHaveProperty(
        'data._entities[0].name',
        user2Profile.name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].firstName',
        user2.first_name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].lastName',
        user2.last_name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].username',
        user2Profile.username,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].avatarUrl',
        user2Profile.avatar_url,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].accountCreationDate',
        accountBirthUser2.toISOString(),
      );

      expect(res.body.errors.length).toBe(1);
      // expect(res.body.errors[0].message).toBe(
      //   'You are not authorized to access this property',
      // );
    });

    it('should allow accessing private properties for users loaded via resolver reference with the same userId in headers', async () => {
      const res = await request(app)
        .post(url)
        .set(req.headers)
        .send({
          query: print(RESOLVE_REFERENCE_WITH_PRIVATE_PROP),
          variables: {
            id: '1',
          },
        });

      expect(res.body).toHaveProperty(
        'data._entities[0].name',
        user1Profile.name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].firstName',
        user1.first_name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].lastName',
        user1.last_name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].username',
        user1Profile.username,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].avatarUrl',
        user1Profile.avatar_url,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].isPremium', // convert 1/0 to true/false
        !!user1.premium_status,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].accountCreationDate',
        accountBirthUser1.toISOString(),
      );
    });

    it('should forbid accessing private properties for users loaded via resolver reference when no userId is in the headers', async () => {
      const res = await request(app)
        .post(url)
        .set({
          token: 'access_token',
          apiId: '1',
        })
        .send({
          query: print(RESOLVE_REFERENCE_WITH_PRIVATE_PROP),
          variables: {
            id: '2',
          },
        });

      expect(res.body).toHaveProperty(
        'data._entities[0].name',
        user2Profile.name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].accountCreationDate',
        accountBirthUser2.toISOString(),
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].firstName',
        user2.first_name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].lastName',
        user2.last_name,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].username',
        user2Profile.username,
      );

      expect(res.body).toHaveProperty(
        'data._entities[0].avatarUrl',
        user2Profile.avatar_url,
      );

      expect(res.body.errors.length).toBe(1);
      // expect(res.body.errors[0].message).toBe(
      //   'You are not authorized to access this property',
      // );
    });
  });
  describe('user', () => {
    describe('.email', () => {
      it('resolves email field from email header passed down to subgraph (JWT and gateway contract)', async () => {
        const GET_USER = gql`
          query user {
            user {
              email
            }
          }
        `;
        const res = await request(app)
          .post(url)
          .set({ email: 'email@email.com', ...req.headers })
          .send({
            query: print(GET_USER),
          });
        expect(res.body.data?.user.email).toBe('email@email.com');
        expect(res.body.errors).toBeUndefined();
      });
    });
  });
});

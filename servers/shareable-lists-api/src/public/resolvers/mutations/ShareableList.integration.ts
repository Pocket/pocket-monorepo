import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import {
  List,
  Visibility,
  ModerationStatus,
  // PilotUser,
  PrismaClient,
} from '.prisma/client';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { faker } from '@faker-js/faker';
// import slugify from 'slugify';
import { startServer } from '../../../express';
import { IPublicContext } from '../../context';
import { client, conn } from '../../../database/client';
import {
  CreateAndAddToShareableListInput,
  CreateShareableListInput,
  UpdateShareableListInput,
} from '../../../database/types';
import {
  CREATE_SHAREABLE_LIST,
  DELETE_SHAREABLE_LIST,
  UPDATE_SHAREABLE_LIST,
  CREATE_AND_ADD_TO_SHAREABLE_LIST,
} from './sample-mutations.gql';
import {
  clearDb,
  createPilotUserHelper,
  createShareableListHelper,
  createShareableListItemHelper,
  mockRedisServer,
} from '../../../test/helpers';
// import config from '../../../config';
import {
  ACCESS_DENIED_ERROR,
  LIST_TITLE_MAX_CHARS,
  LIST_DESCRIPTION_MAX_CHARS,
} from '../../../shared/constants';
import { Application } from 'express';
import { IAdminContext } from '../../../admin/context';
import { Kysely } from 'kysely';
import { DB } from '.kysely/client/types';

describe('public mutations: ShareableList', () => {
  let app: Application;
  let server: ApolloServer<IPublicContext>;
  let adminServer: ApolloServer<IAdminContext>;
  let graphQLUrl: string;
  let db: PrismaClient;
  let con: Kysely<DB>;

  // let pilotUser2: PilotUser;

  // this user will be put into the pilot
  const pilotUserHeaders = {
    userId: '8009882300',
  };

  // this is a public, non-pilot user
  const publicUserHeaders = {
    userId: '7737795683',
  };

  beforeAll(async () => {
    mockRedisServer();
    // port 0 tells express to dynamically assign an available port
    ({
      app,
      publicServer: server,
      adminServer: adminServer,
      publicUrl: graphQLUrl,
    } = await startServer(0));
    db = client();
    con = conn();
    // we mock the send method on EventBridgeClient
    jest
      .spyOn(EventBridgeClient.prototype, 'send')
      .mockClear()
      .mockImplementation(() => Promise.resolve({ FailedEntryCount: 0 }));
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await db.$disconnect();
    await con.destroy();
    await server.stop();
    await adminServer.stop();
  });

  beforeEach(async () => {
    await clearDb(db);

    // create pilot users
    await createPilotUserHelper(db, {
      userId: parseInt(pilotUserHeaders.userId),
    });
  });

  describe('createShareableList', () => {
    beforeAll(async () => {
      // Create a List
      await createShareableListHelper(db, {
        userId: parseInt(pilotUserHeaders.userId),
        title: 'Simon Le Bon List',
      });
    });

    it('should not create a new List without userId in header', async () => {
      const title = faker.lorem.words(2);
      const data: CreateShareableListInput = {
        title: title,
        description: faker.lorem.sentences(2),
      };
      const result = await request(app)
        .post(graphQLUrl)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData: data },
        });
      expect(result.body.data.createShareableList).toBeFalsy();
      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('FORBIDDEN');
      expect(result.body.errors[0].message).toBe(ACCESS_DENIED_ERROR);
    });

    it('should not cache the results', async () => {
      const data: CreateShareableListInput = {
        title: faker.lorem.words(5),
        description: faker.lorem.sentences(2),
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData: data },
        });

      expect(result.body.errors).toBeFalsy();

      // This mutation should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).toBe('no-store');
    });

    it('should escape HTML in the title and description', async () => {
      const data: CreateShareableListInput = {
        title: 'My list to share<script>alert("Hello World!")</script>',
        description:
          'A description to share<script>alert("Hello World!")</script>',
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData: data },
        });

      expect(result.body.data.createShareableList.title).toBe(
        'My list to share&lt;script&gt;alert("Hello World!")&lt;/script&gt;',
      );

      expect(result.body.data.createShareableList.description).toBe(
        'A description to share&lt;script&gt;alert("Hello World!")&lt;/script&gt;',
      );
    });

    it('should create a new List with default visibilities', async () => {
      const data: CreateShareableListInput = {
        title: faker.lorem.words(4),
        description: faker.lorem.sentences(2),
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData: data },
        });

      expect(result.body.data).toBeDefined();

      const list = result.body.data.createShareableList;

      // as passed in explicitly
      expect(list.title).toBe(data.title);
      expect(list.description).toBe(data.description);

      // user entity should match the creator's id
      expect(list.user).toEqual({ id: publicUserHeaders.userId });

      // expect no listItems in result
      expect(list.listItems.length).toBe(0);

      // fields that should have default values
      expect(list.status).toBe(Visibility.PRIVATE);
      expect(list.moderationStatus).toBe(ModerationStatus.VISIBLE);
      expect(list.listItemNoteVisibility).toBe(Visibility.PRIVATE);
    });

    it('should not create a new List with a ListItem with an invalid itemId', async () => {
      const title = 'My list to share<script>alert("Hello World!")</script>';
      const listData: CreateShareableListInput = {
        title: title,
        description: faker.lorem.sentences(2),
      };

      const listItemData = {
        itemId: '378asdf9538749', // invalid!
        url: 'https://www.test.com/this-is-a-story',
        title: 'A story is a story',
        excerpt: '<blink>The best story ever told</blink>',
        imageUrl: 'https://www.test.com/thumbnail.jpg',
        publisher: 'The London Times',
        authors: 'Charles Dickens, Mark Twain',
        sortOrder: 10,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData, listItemData },
        });

      const errors = result.body.errors;

      expect(errors.length).toBe(1);
      expect(errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(errors[0].message).toBe(
        `${listItemData.itemId} is an invalid itemId`,
      );
    });

    it('should create a new List with a ListItem', async () => {
      const listData: CreateShareableListInput = {
        title: faker.lorem.words(4),
        description: faker.lorem.sentences(2),
      };

      const listItemData = {
        itemId: '3789538749',
        url: 'https://www.test.com/this-is-a-story',
        title: 'A story is a story',
        excerpt: '<blink>The best story ever told</blink>',
        imageUrl: 'https://www.test.com/thumbnail.jpg',
        publisher: 'The London Times',
        authors: 'Charles Dickens, Mark Twain',
        sortOrder: 10,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData, listItemData },
        });

      expect(result.body.data).toBeDefined();

      const list = result.body.data.createShareableList;

      // specified list properties should be as expected
      expect(list.title).toBe(listData.title);
      expect(list.description).toBe(listData.description);

      // expect 1 listItem in result with all supplied data
      expect(list.listItems.length).toBe(1);

      const listItem = list.listItems[0];

      expect(listItem.title).toBe(listItemData.title);
      expect(listItem.url).toBe(listItemData.url);
      expect(listItem.itemId).toBe(listItemData.itemId);
      expect(listItem.excerpt).toBe(listItemData.excerpt);
      expect(listItem.imageUrl).toBe(listItemData.imageUrl);
      expect(listItem.publisher).toBe(listItemData.publisher);
      expect(listItem.authors).toBe(listItemData.authors);
      expect(listItem.sortOrder).toBe(listItemData.sortOrder);
    });

    it('should not create List with existing title for the same userId', async () => {
      const list1 = await createShareableListHelper(db, {
        title: `Katerina's List`,
        userId: parseInt(publicUserHeaders.userId),
      });
      const title1 = list1.title;
      // create new List with title1 value for the same user
      const data: CreateShareableListInput = {
        title: title1,
        description: faker.lorem.sentences(2),
      };
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData: data },
        });
      expect(result.body.data.createShareableList).toBeFalsy();
      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.body.errors[0].message).toBe(
        `A list with the title "Katerina's List" already exists`,
      );
    });

    it('should not create List with a title of more than 100 chars', async () => {
      const data: CreateShareableListInput = {
        title: faker.string.alpha(LIST_TITLE_MAX_CHARS + 1),
        description: faker.lorem.sentences(2),
      };
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData: data },
        });
      expect(result.body.data).toBeFalsy();

      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.body.errors[0].message).toContain(
        `Must be no more than ${LIST_TITLE_MAX_CHARS} characters in length`,
      );
    });

    it('should not create List with a description of more than 200 chars', async () => {
      const data: CreateShareableListInput = {
        title: `Katerina's List`,
        description: faker.string.alpha(LIST_DESCRIPTION_MAX_CHARS + 1),
      };
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData: data },
        });
      expect(result.body.data).toBeFalsy();
      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.body.errors[0].message).toContain(
        `Must be no more than ${LIST_DESCRIPTION_MAX_CHARS} characters in length`,
      );
    });

    it('should create List with existing title in db but for different userId', async () => {
      const list1 = await createShareableListHelper(db, {
        title: `Best Abstraction Art List`,
        userId: parseInt('8765'),
      });

      const title1 = list1.title;

      // create new List with title1 value for the same user
      const data: CreateShareableListInput = {
        title: title1,
        description: faker.lorem.sentences(2),
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData: data },
        });

      expect(result.body.data.createShareableList.title).toBe(title1);
    });

    it('should create List with a missing description', async () => {
      // create new List with a missing description
      const data: CreateShareableListInput = {
        title: `List with missing description`,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData: data },
        });

      const list = result.body.data.createShareableList;

      expect(list).toBeDefined();
      expect(list.title).toBe(data.title);
      expect(list.description).toBe(null);
    });

    it('should create List with a PUBLIC listItemNoteVisibility for a pilot user', async () => {
      const data: CreateShareableListInput = {
        title: `My side projects`,
        listItemNoteVisibility: Visibility.PUBLIC,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(pilotUserHeaders)
        .send({
          query: print(CREATE_SHAREABLE_LIST),
          variables: { listData: data },
        });

      expect(result.body.data.createShareableList.listItemNoteVisibility).toBe(
        data.listItemNoteVisibility,
      );
    });
  });

  describe('deleteShareableList', () => {
    it('must not delete a list not owned by the current user', async () => {
      const otherUserId = parseInt(pilotUserHeaders.userId) + 1;
      const otherUserList = await createShareableListHelper(db, {
        title: `Someone else's list`,
        userId: otherUserId,
      });
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(DELETE_SHAREABLE_LIST),
          variables: { externalId: otherUserList.externalId },
        });
      expect(result.body.data).toBeNull();
      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('cannot delete a list that does not exist', async () => {
      const dummyId = '1234567-1234-1234-1234-123456789012';
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(DELETE_SHAREABLE_LIST),
          variables: { externalId: dummyId },
        });
      expect(result.body.data).toBeNull();
      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('will delete a list created by the current user', async () => {
      const theList = await createShareableListHelper(db, {
        title: `A list to be deleted`,
        userId: BigInt(publicUserHeaders.userId),
      });
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(DELETE_SHAREABLE_LIST),
          variables: { externalId: theList.externalId },
        });

      // This mutation should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).toBe('no-store');
      expect(result.body.errors).toBeUndefined();

      const list = result.body.data.deleteShareableList;

      expect(list).toBeDefined();
      expect(list.externalId).toBe(theList.externalId);
      expect(list.title).toBe(theList.title);
      expect(list.user).toEqual({ id: publicUserHeaders.userId });
    });

    it('will clear all items from a list', async () => {
      // first make a list
      const theList = await createShareableListHelper(db, {
        title: `A list to be deleted`,
        userId: BigInt(publicUserHeaders.userId),
      });
      // then create some list items
      const makeItems = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < makeItems; i++) {
        await createShareableListItemHelper(db, {
          list: theList,
        });
      }
      //make sure that that worked
      let itemCount = await db.listItem.count({
        where: { listId: theList.id },
      });
      expect(itemCount).toBe(makeItems);
      // now clear the list and check the result
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(DELETE_SHAREABLE_LIST),
          variables: { externalId: theList.externalId },
        });
      expect(result.body.errors).toBeUndefined();
      itemCount = await db.listItem.count({
        where: { listId: theList.id },
      });
      expect(itemCount).toBe(0);
    });
  });

  describe('updateShareableList', () => {
    let pilotUserList: List;
    let nonPilotUserList: List;
    let publicList: List;

    // for strong checks on createdAt and updatedAt values
    const arbitraryTimestamp = 1664400000000;
    const oneDay = 86400000;

    beforeEach(async () => {
      // Create a List for a pilot user
      pilotUserList = await createShareableListHelper(db, {
        userId: parseInt(pilotUserHeaders.userId),
        title: 'The Most Shareable List',
      });

      // Create a List for a non-pilot user
      nonPilotUserList = await createShareableListHelper(db, {
        userId: parseInt(publicUserHeaders.userId),
        title: 'The Most Shareable List',
      });

      // Create a public list
      publicList = await createShareableListHelper(db, {
        userId: parseInt(pilotUserHeaders.userId),
        title: 'Burning Rose',
        status: Visibility.PUBLIC,
        slug: 'burning-rose',
      });
    });

    it('should not update a list if the current user is not the owner', async () => {
      const data: UpdateShareableListInput = {
        externalId: nonPilotUserList.externalId,
        description: 'new description by a HACKER',
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set({
          userId: '848135',
        })
        .send({
          query: print(UPDATE_SHAREABLE_LIST),
          variables: { data },
        });

      expect(result.body.data).toBeNull();

      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('should not update a list to PUBLIC -- non pilot user', async () => {
      const data: UpdateShareableListInput = {
        externalId: nonPilotUserList.externalId,
        status: Visibility.PUBLIC,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST),
          variables: { data },
        });

      expect(result.body.data).toBeNull();

      expect(result.body.errors[0].extensions.code).toBe('FORBIDDEN');
      expect(result.body.errors[0].message).toBe(ACCESS_DENIED_ERROR);
    });

    it('should not update a list to PUBLIC -- pilot user', async () => {
      const data: UpdateShareableListInput = {
        externalId: pilotUserList.externalId,
        status: Visibility.PUBLIC,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(pilotUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST),
          variables: { data },
        });

      expect(result.body.data).toBeNull();

      expect(result.body.errors[0].extensions.code).toBe('FORBIDDEN');
      expect(result.body.errors[0].message).toBe(ACCESS_DENIED_ERROR);
    });

    // it('should update a list to PUBLIC if the user is in the pilot', async () => {
    //   const data: UpdateShareableListInput = {
    //     externalId: pilotUserList.externalId,
    //     status: Visibility.PUBLIC,
    //   };

    //   const result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data },
    //     });

    //   expect(result.body.errors).to.be.undefined;

    //   expect(result.body.data.updateShareableList).not.to.be.null;
    //   expect(result.body.data.updateShareableList.status).to.equal(data.status);
    // });

    it('should update a list and return all props', async () => {
      // stub the clock so we can directly check updatedAt
      jest.useFakeTimers({
        now: arbitraryTimestamp,
        advanceTimers: false,
      });

      // advance the clock one day
      jest.advanceTimersByTime(oneDay);

      const data: UpdateShareableListInput = {
        externalId: pilotUserList.externalId,
        title: 'This Will Be A Brand New Title',
        description: faker.lorem.sentences(2),
        status: Visibility.PRIVATE,
        listItemNoteVisibility: Visibility.PUBLIC,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(pilotUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST),
          variables: { data },
        });

      // This mutation should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).toBe('no-store');
      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.updateShareableList).not.toBeNull();

      // Verify that all optional properties have been updated
      const updatedList = result.body.data.updateShareableList;

      expect(updatedList.title).toBe(data.title);
      expect(updatedList.description).toBe(data.description);
      expect(updatedList.status).toBe(data.status);
      expect(updatedList.listItemNoteVisibility).toBe(
        data.listItemNoteVisibility,
      );

      // Check that props that shouldn't have changed stayed the same
      expect(updatedList.slug).toBe(pilotUserList.slug);
      expect(updatedList.moderationStatus).toBe(pilotUserList.moderationStatus);
      expect(updatedList.createdAt).toBe(pilotUserList.createdAt.toISOString());
      expect(updatedList.listItems).toHaveLength(0);
      expect(updatedList.user).toEqual({ id: pilotUserHeaders.userId });

      // The `updatedAt` timestamp should change
      expect(Date.parse(updatedList.updatedAt)).toBe(
        arbitraryTimestamp + oneDay,
      );

      jest.useRealTimers();
    });

    it('should update a list (PUBLIC status -> PUBLIC status)', async () => {
      const data: UpdateShareableListInput = {
        externalId: publicList.externalId,
        status: Visibility.PUBLIC,
        description: 'new description',
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(pilotUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST),
          variables: { data },
        });

      // This mutation should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).toBe('no-store');
      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.updateShareableList).not.toBeNull();
      const updatedList = result.body.data.updateShareableList;

      expect(updatedList.description).toBe(data.description);
      expect(updatedList.status).toBe(data.status); // status should stay PUBLIC
    });

    it('should return a "Not Found" error if no list exists', async () => {
      const data: UpdateShareableListInput = {
        externalId: 'this-will-never-be-found',
        title: 'This Will Never Get Into The Database',
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST),
          variables: { data },
        });

      // There should be nothing in results
      expect(result.body.data).toBeNull();

      // And a "Not found" error
      expect(result.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('should reject the update if user already has a list with the same title', async () => {
      const anotherListProps = {
        userId: parseInt(publicUserHeaders.userId),
        title: 'A Very Popular Title',
      };
      await createShareableListHelper(db, anotherListProps);

      const data: UpdateShareableListInput = {
        externalId: nonPilotUserList.externalId,
        title: anotherListProps.title,
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST),
          variables: { data },
        });

      // There should be nothing in results
      expect(result.body.data).toBeNull();

      // And a "Bad user input" error
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });

    it('should allow the update if the existing title is passed', async () => {
      const data: UpdateShareableListInput = {
        externalId: nonPilotUserList.externalId,
        title: nonPilotUserList.title, // send the existing title
        description: 'my b i forgot the description last time',
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST),
          variables: { data },
        });

      // This mutation should not be cached, expect headers.cache-control = no-store
      expect(result.headers['cache-control']).toBe('no-store');
      // There should be no errors
      expect(result.body.errors).toBeUndefined();

      // A result should be returned
      expect(result.body.data.updateShareableList).not.toBeNull();

      // the title should remain unchanged
      expect(result.body.data.updateShareableList.title).toBe(data.title);
    });

    // The following test-cases are commented out as making lists PUBLIC is not supported atm.

    // it('should generate a slug if a list is being made public for the first time', async () => {
    //   const data: UpdateShareableListInput = {
    //     externalId: pilotUserList.externalId,
    //     status: Visibility.PUBLIC,
    //   };

    //   const result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data },
    //     });

    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList = result.body.data.updateShareableList;
    //   expect(updatedList.status).to.equal(Visibility.PUBLIC);
    //   expect(updatedList.slug).not.to.be.empty;

    //   // Does the slug match the current title?
    //   expect(updatedList.slug).to.equal(
    //     slugify(updatedList.title, config.slugify)
    //   );
    // });

    // it('should generate a slug from updated title if one is provided and made public for the first time', async () => {
    //   const data: UpdateShareableListInput = {
    //     externalId: pilotUserList.externalId,
    //     title: 'This Title is Different',
    //     status: Visibility.PUBLIC,
    //   };

    //   const result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data },
    //     });

    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList = result.body.data.updateShareableList;
    //   expect(updatedList.status).to.equal(Visibility.PUBLIC);
    //   expect(updatedList.slug).not.to.be.empty;

    //   // Does the slug match the updated title?
    //   expect(updatedList.slug).to.equal(slugify(data.title, config.slugify));
    // });

    // it('should append next consecutive number to generated slug for list made public for the first time if slug containing list title already exists for a single user', async () => {
    //   let dataList1: UpdateShareableListInput;
    //   // create list 1
    //   const firstList = await createShareableListHelper(db, {
    //     title: `Hangover Hotel`,
    //     userId: BigInt(pilotUserHeaders.userId),
    //   });
    //   // make list 1 PUBLIC
    //   dataList1 = {
    //     externalId: firstList.externalId,
    //     status: Visibility.PUBLIC,
    //   };

    //   let result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data: dataList1 },
    //     });

    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList = result.body.data.updateShareableList;
    //   expect(updatedList.status).to.equal(Visibility.PUBLIC);
    //   expect(updatedList.slug).not.to.be.empty;

    //   // Does the slug match the list 1 title?
    //   expect(updatedList.slug).to.equal(
    //     slugify(firstList.title, config.slugify)
    //   );

    //   // Update list 1 title
    //   dataList1 = {
    //     externalId: firstList.externalId,
    //     title: 'Sugar and Sunshine',
    //   };

    //   result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data: dataList1 },
    //     });

    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList1a = result.body.data.updateShareableList;
    //   expect(updatedList1a.status).to.equal(Visibility.PUBLIC);
    //   expect(updatedList1a.title).to.equal(dataList1.title);
    //   // We don't expect the slug to be updated. Tt should match the original generated slug (hangover-hotel).
    //   expect(updatedList1a.slug).to.equal(updatedList.slug);

    //   // Now create a new list 2 with List 1 original title (Hangover Hotel)
    //   const secondList = await createShareableListHelper(db, {
    //     title: `Hangover Hotel`,
    //     userId: BigInt(pilotUserHeaders.userId),
    //   });
    //   // make list 2 PUBLIC
    //   const dataList2 = {
    //     externalId: secondList.externalId,
    //     status: Visibility.PUBLIC,
    //   };

    //   result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data: dataList2 },
    //     });

    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList2 = result.body.data.updateShareableList;
    //   expect(updatedList2.status).to.equal(Visibility.PUBLIC);
    //   expect(updatedList2.title).to.equal(secondList.title);
    //   // Expect the slug to equal hangover-hotel-2
    //   expect(updatedList2.slug).to.equal('hangover-hotel-2');
    // });

    // it('should remove emojis from slugs', async () => {
    //   const data: UpdateShareableListInput = {
    //     externalId: pilotUserList.externalId,
    //     title: 'This 👏 Title 👏 Is 👏 Full 👏 Of 👏 Emojis',
    //     status: Visibility.PUBLIC,
    //   };

    //   const result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data },
    //     });

    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList = result.body.data.updateShareableList;
    //   expect(updatedList.status).to.equal(Visibility.PUBLIC);
    //   expect(updatedList.slug).not.to.be.empty;

    //   // Does the slug look as expected?
    //   expect(updatedList.slug).to.equal('this-title-is-full-of-emojis');
    // });

    // it('should generate a neutral title if slugified title is empty', async () => {
    //   const data: UpdateShareableListInput = {
    //     externalId: pilotUserList.externalId,
    //     title: '👀 😱 😈 💚 👌 🔮️',
    //     status: Visibility.PUBLIC,
    //   };

    //   const result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data },
    //     });

    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList = result.body.data.updateShareableList;
    //   expect(updatedList.status).to.equal(Visibility.PUBLIC);
    //   expect(updatedList.slug).not.to.be.empty;

    //   // Since the slug is whittled away into nothingness with the removal
    //   // of spaces and emojis, a neutral slug is used instead
    //   expect(updatedList.slug).to.equal('shared-list');
    // });

    // it('should append consecutive numbers to slugs if user has multiple lists with all-emoji titles', async () => {
    //   // create list 1
    //   const firstList = await createShareableListHelper(db, {
    //     title: '🌞 🌝 🌛 🌜 🌚 🌕 🌖 🌗 🌘 🌑 🌒 🌓 🌔 🌙',
    //     userId: BigInt(pilotUserHeaders.userId),
    //   });
    //   // make list 1 PUBLIC
    //   const dataList1 = {
    //     externalId: firstList.externalId,
    //     status: Visibility.PUBLIC,
    //   };

    //   let result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data: dataList1 },
    //     });

    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList = result.body.data.updateShareableList;
    //   expect(updatedList.status).to.equal(Visibility.PUBLIC);
    //   expect(updatedList.slug).not.to.be.empty;

    //   // Is the slug the expected neutral name?
    //   expect(updatedList.slug).to.equal('shared-list');

    //   // Now create a new list with an all-emoji title, too
    //   const secondList = await createShareableListHelper(db, {
    //     title: '🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍',
    //     userId: BigInt(pilotUserHeaders.userId),
    //   });
    //   // make list 2 PUBLIC
    //   const dataList2 = {
    //     externalId: secondList.externalId,
    //     status: Visibility.PUBLIC,
    //   };

    //   result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data: dataList2 },
    //     });

    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList2 = result.body.data.updateShareableList;
    //   expect(updatedList2.status).to.equal(Visibility.PUBLIC);
    //   expect(updatedList2.title).to.equal(secondList.title);
    //   // Expect the slug to equal shared-list-2
    //   expect(updatedList2.slug).to.equal('shared-list-2');
    // });

    // it('should generate two identical slugs but for two different users', async () => {
    //   // create list 1
    //   const firstList = await createShareableListHelper(db, {
    //     title: `Hangover Hotel`,
    //     userId: BigInt(pilotUserHeaders.userId),
    //   });
    //   // make list 1 PUBLIC
    //   const dataList1 = {
    //     externalId: firstList.externalId,
    //     status: Visibility.PUBLIC,
    //   };

    //   let result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data: dataList1 },
    //     });
    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList = result.body.data.updateShareableList;
    //   expect(updatedList.status).to.equal(Visibility.PUBLIC);
    //   expect(updatedList.slug).not.to.be.empty;

    //   // Does the slug match the list 1 title (hangover-hotel)?
    //   expect(updatedList.slug).to.equal(
    //     slugify(firstList.title, config.slugify)
    //   );

    //   const headersUser2 = {
    //     userId: pilotUser2.userId,
    //   };
    //   const secondList = await createShareableListHelper(db, {
    //     title: `Hangover Hotel`,
    //     userId: BigInt(headersUser2.userId),
    //   });
    //   // make list 2 PUBLIC
    //   const dataList2 = {
    //     externalId: secondList.externalId,
    //     status: Visibility.PUBLIC,
    //   };

    //   result = await request(app)
    //     .post(graphQLUrl)
    //     .set(headersUser2)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data: dataList2 },
    //     });
    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList2 = result.body.data.updateShareableList;
    //   expect(updatedList2.status).to.equal(Visibility.PUBLIC);
    //   expect(updatedList2.title).to.equal(secondList.title);
    //   // Expect the slug to equal hangover-hotel
    //   expect(updatedList2.slug).to.equal(
    //     slugify(secondList.title, config.slugify)
    //   );
    // });

    // it('should not update the slug once set if any other updates are made', async () => {
    //   // Run through the steps to publish the list and update the slug
    //   const data: UpdateShareableListInput = {
    //     externalId: pilotUserList.externalId,
    //     title: 'This Title Could Not Be More Different',
    //     status: Visibility.PUBLIC,
    //   };

    //   const result = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data },
    //     });
    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result.body.data.updateShareableList).not.to.be.null;

    //   // Let's save the list in this updated state
    //   const listWithSlugSet = result.body.data.updateShareableList;

    //   // Now update the title, status, description and see if anything happens
    //   // to the slug
    //   const data2: UpdateShareableListInput = {
    //     externalId: pilotUserList.externalId,
    //     title: 'Suddenly This List is Private Again',
    //     description: 'I really should have kept this to myself',
    //     status: Visibility.PRIVATE,
    //   };

    //   const result2 = await request(app)
    //     .post(graphQLUrl)
    //     .set(pilotUserHeaders)
    //     .send({
    //       query: print(UPDATE_SHAREABLE_LIST),
    //       variables: { data: data2 },
    //     });
    //   // This mutation should not be cached, expect headers.cache-control = no-store
    //   expect(result.headers['cache-control']).to.equal('no-store');
    //   // There should be no errors
    //   expect(result2.body.errors).to.be.undefined;

    //   // A result should be returned
    //   expect(result2.body.data.updateShareableList).not.to.be.null;

    //   // Verify that the updates have taken place
    //   const updatedList = result2.body.data.updateShareableList;
    //   expect(updatedList.status).to.equal(Visibility.PRIVATE);
    //   expect(updatedList.title).to.equal(data2.title);
    //   expect(updatedList.description).to.equal(data2.description);

    //   // Is the slug unchanged? It should be!
    //   expect(updatedList.slug).to.equal(listWithSlugSet.slug);
    // });

    it('should not update List with a title of more than 100 chars', async () => {
      const data: UpdateShareableListInput = {
        externalId: nonPilotUserList.externalId,
        title: faker.string.alpha(LIST_TITLE_MAX_CHARS + 1),
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST),
          variables: { data },
        });

      // There should be nothing in results
      expect(result.body.data).toBeFalsy();

      // And a "Bad user input" error
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.body.errors[0].extensions.field).toBe('data.title');
      expect(result.body.errors[0].message).toContain(
        'Must be no more than 100 characters in length',
      );
    });

    it('should not update List with a description of more than 200 chars', async () => {
      const data: UpdateShareableListInput = {
        externalId: nonPilotUserList.externalId,
        description: faker.string.alpha(LIST_DESCRIPTION_MAX_CHARS + 1),
      };

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(UPDATE_SHAREABLE_LIST),
          variables: { data },
        });

      // There should be nothing in results
      expect(result.body.data).toBeFalsy();

      // And a "Bad user input" error
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.body.errors[0].extensions.field).toBe('data.description');
      expect(result.body.errors[0].message).toContain(
        'Must be no more than 200 characters in length',
      );
    });
  });
  describe('createAndAddToShareableList', () => {
    it('creates a new shareable list with one item', async () => {
      const listData: CreateShareableListInput = {
        title: faker.lorem.words(4),
        description: faker.lorem.sentences(2),
      };

      const itemData: CreateAndAddToShareableListInput['itemData'] = [
        {
          itemId: '3789538749',
          url: 'https://www.test.com/this-is-a-story',
          title: 'A story is a story',
          excerpt: '<blink>The best story ever told</blink>',
          imageUrl: 'https://www.test.com/thumbnail.jpg',
          publisher: 'The London Times',
          authors: 'Charles Dickens, Mark Twain',
        },
      ];

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_AND_ADD_TO_SHAREABLE_LIST),
          variables: { listData, itemData },
        });

      expect(result.body.errors).not.toBeDefined();
      const expected = {
        createAndAddToShareableList: expect.objectContaining({
          ...listData,
          listItems: [
            expect.objectContaining({ ...itemData[0], sortOrder: 0 }),
          ],
        }),
      };
      expect(result.body.data).toEqual(expected);
    });
    it('creates a new shareable list with 1+ items', async () => {
      const listData: CreateShareableListInput = {
        title: faker.lorem.words(4),
        description: faker.lorem.sentences(2),
      };

      const itemBase = {
        title: 'A story is a story',
        excerpt: '<blink>The best story ever told</blink>',
        imageUrl: 'https://www.test.com/thumbnail.jpg',
        publisher: 'The London Times',
        authors: 'Charles Dickens, Mark Twain',
      };

      const itemData: CreateAndAddToShareableListInput['itemData'] = [
        {
          itemId: '3789538749',
          url: 'https://www.test.com/this-is-a-story',
          ...itemBase,
        },
        {
          itemId: '12345',
          url: 'https://www.domain.com/another-story',
        },
        {
          itemId: '999999',
          url: 'https://www.another.com/more-story',
        },
      ];

      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_AND_ADD_TO_SHAREABLE_LIST),
          variables: { listData, itemData },
        });

      expect(result.body.errors).not.toBeDefined();
      const expected = {
        createAndAddToShareableList: expect.objectContaining({
          ...listData,
          listItems: [
            expect.objectContaining({ ...itemData[0], sortOrder: 0 }),
            expect.objectContaining({ ...itemData[1], sortOrder: 1 }),
            expect.objectContaining({ ...itemData[2], sortOrder: 2 }),
          ],
        }),
      };
      expect(result.body.data).toEqual(expected);
    });
    it('does not make a new shareable list if one with the same title exists already', async () => {
      const list1 = await createShareableListHelper(db, {
        title: `Baldur's Gate 3 Companion Guides`,
        userId: parseInt(publicUserHeaders.userId),
      });
      const itemData: CreateAndAddToShareableListInput['itemData'] = [
        {
          itemId: '3789538749',
          url: 'https://www.test.com/this-is-a-story',
          title: 'A story is a story',
          excerpt: '<blink>The best story ever told</blink>',
          imageUrl: 'https://www.test.com/thumbnail.jpg',
          publisher: 'The London Times',
          authors: 'Charles Dickens, Mark Twain',
        },
      ];
      const title1 = list1.title;
      // create new List with title1 value for the same user
      const data: CreateShareableListInput = {
        title: title1,
        description: faker.lorem.sentences(2),
      };
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_AND_ADD_TO_SHAREABLE_LIST),
          variables: { listData: data, itemData },
        });
      expect(result.body.data.createShareableList).toBeFalsy();
      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.body.errors[0].message).toBe(
        `A list with the title "Baldur's Gate 3 Companion Guides" already exists`,
      );
    });
    it('does not make a new shareable list if the items do not validate', async () => {
      const itemData: CreateAndAddToShareableListInput['itemData'] = [
        {
          itemId: 'abcdef',
          url: 'https://www.test.com/this-is-a-story',
          title: 'A story is a story',
          excerpt: '<blink>The best story ever told</blink>',
          imageUrl: 'https://www.test.com/thumbnail.jpg',
          publisher: 'The London Times',
          authors: 'Charles Dickens, Mark Twain',
        },
      ];
      // create new List with title1 value for the same user
      const data: CreateShareableListInput = {
        title: faker.lorem.words(4),
        description: faker.lorem.sentences(2),
      };
      const result = await request(app)
        .post(graphQLUrl)
        .set(publicUserHeaders)
        .send({
          query: print(CREATE_AND_ADD_TO_SHAREABLE_LIST),
          variables: { listData: data, itemData },
        });
      expect(result.body.data.createShareableList).toBeFalsy();
      expect(result.body.errors.length).toBe(1);
      expect(result.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.body.errors[0].message).toBe('abcdef is an invalid itemId');
      const dbResult = await db.list.findFirst({
        where: {
          title: data.title,
        },
      });
      expect(dbResult).toBeNull();
    });
  });
});

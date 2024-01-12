import { Visibility, PilotUser, PrismaClient } from '@prisma/client';
import {
  createPilotUserHelper,
  createShareableListHelper,
  createShareableListItemHelper,
} from '../src/test/helpers';
import { faker } from '@faker-js/faker';
import { updateShareableList } from '../src/database/mutations';
import { setLogger } from '@pocket-tools/ts-logger';

const prismaSeedLogger = setLogger();
const prisma = new PrismaClient();

async function main() {
  // This seed script creates a number of shareable lists so that
  // they can be looked up and moderated in the Curation Admin Tools frontend

  // First we need a handful of users, though
  const userIds: number[] = [12345, 34567, 45678, 78901];
  const users: PilotUser[] = [];

  for (const userId of userIds) {
    const user = await createPilotUserHelper(prisma, { userId });
    users.push(user);
  }

  // Now it's time to create some lists for these users
  const listTitles: string[] = [];

  for (let i = 0; i < 50; i++) {
    listTitles.push(faker.lorem.sentence());
  }

  for (const title of listTitles) {
    // get a random user from our array of users
    const randomUser = users[Math.floor(Math.random() * users.length)];

    // create a list for this random user
    const list = await createShareableListHelper(prisma, {
      title,
      userId: randomUser.userId,
    });

    // Turn some lists public so that the status changes and a slug is generated.
    // This seed data is created for the benefit of testing the admin tools after all.
    if (Math.random() > 0.5) {
      await updateShareableList(
        prisma,
        { externalId: list.externalId, status: Visibility.PUBLIC },
        randomUser.userId
      );
    }

    // add between 5 and 10 Pocket stories to this list
    const numberOfStories = Math.floor(Math.random() * 5) + 5;

    for (let i = 0; i <= numberOfStories; i++) {
      await createShareableListItemHelper(prisma, { list }).catch(
        prismaSeedLogger.error
      );
    }
  }
}

main()
  .catch((e) => {
    prismaSeedLogger.error({ error: e, message: 'primsa seed main() error' });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

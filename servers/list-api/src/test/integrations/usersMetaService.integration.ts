import Client from '../../database/client.js';
import { UsersMetaService } from '../../dataService/index.js';
import { ContextManager } from '../../server/context.js';
import { mysqlTimeString } from '../../dataService/utils.js';
import config from '../../config/index.js';

describe('UsersMetaService ', () => {
  const writeDb = Client.writeClient();
  const readDb = Client.readClient();
  const context = new ContextManager({
    request: {
      headers: {
        userid: '1',
        apiid: '0',
      },
    },
    dbClient: readDb,
    eventEmitter: null,
  });
  const currentTime = new Date();
  const usersMetaService = new UsersMetaService(context);

  beforeEach(async () => {
    await writeDb('users_meta').truncate();
  });

  afterAll(async () => {
    await readDb.destroy();
    await writeDb.destroy();
  });

  it('inserts a record for tags and deletes old record', async () => {
    await writeDb('users_meta').insert({
      user_id: 1,
      property: 18,
      value: '2019-02-02 00:00:00',
      time_updated: '2019-02-02 00:00:00',
    });
    await writeDb.transaction(async (trx) => {
      await usersMetaService.logTagMutation(currentTime, trx);
    });
    const res = await readDb('users_meta')
      .select()
      .where({ user_id: 1, property: 18 });
    expect(res.length).toBe(1);
    expect(res[0].property).toBe(18);
    expect(res[0].value).toBe(mysqlTimeString(currentTime, config.database.tz));
    expect(res[0].time_updated).toBeBetween(
      new Date(currentTime.getTime() - 1000),
      new Date(currentTime.getTime() + 1000),
    ); // mySQL isn't storing milliseconds
  });
});

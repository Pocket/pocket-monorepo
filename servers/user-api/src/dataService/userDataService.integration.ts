import { NotFoundError } from '@pocket-tools/apollo-utils';
import { IContext } from '../context.js';
import { readClient, writeClient } from '../database/client.js';
import { UserDataService } from './userDataService.js';
import { UserFirefoxAccountSeed } from '../test/functional/seeds.js';

describe('userDataService', () => {
  const readDb = readClient();
  const writeDb = writeClient();

  describe('getPocketIdByFxaId', () => {
    beforeAll(async () => {
      await writeDb('user_firefox_account').truncate();
      await writeDb('user_firefox_account').insert(
        UserFirefoxAccountSeed({
          user_id: 777,
          firefox_uid: '1234',
        }),
      );
    });
    afterAll(async () => {
      await writeDb('user_firefox_account').truncate();
      await writeDb.destroy();
      await readDb.destroy();
    });
    it('returns a string id', async () => {
      const userDataService = await UserDataService.fromFxaId(
        { db: { readClient: readDb } } as unknown as IContext, // just need that prop
        '1234',
      );
      expect(userDataService.userId === '777').toBe(true);
    });
    it('Throws an error if the id does not exist', async () => {
      await expect(
        UserDataService.fromFxaId(
          { db: { readClient: readDb } } as unknown as IContext, // just need that prop
          '9999',
        ),
      ).rejects.toEqual(
        new NotFoundError('userId doesnt exist for given fxaId 9999'),
      );
    });
  });
});

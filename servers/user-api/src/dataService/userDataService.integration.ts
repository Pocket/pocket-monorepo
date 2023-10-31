import { NotFoundError } from '@pocket-tools/apollo-utils';
import { IContext } from '../context';
import { readClient } from '../database/client';
import { UserDataService } from './userDataService';

describe('userDataService', () => {
  const db = readClient();
  describe('getPocketIdByFxaId', () => {
    beforeAll(async () => {
      await db('user_firefox_account').truncate();
      await db('user_firefox_account').insert([
        {
          user_id: 777,
          firefox_uid: '1234',
        },
      ]);
    });
    afterAll(async () => {
      await db('user_firefox_account').truncate();
      await db.destroy();
    });
    it('returns a string id', async () => {
      const userDataService = await UserDataService.fromFxaId(
        { db: { readClient: db } } as unknown as IContext, // just need that prop
        '1234',
      );
      expect(userDataService.userId === '777').toBe(true);
    });
    it('Throws an error if the id does not exist', async () => {
      await expect(
        UserDataService.fromFxaId(
          { db: { readClient: db } } as unknown as IContext, // just need that prop
          '9999',
        ),
      ).rejects.toEqual(
        new NotFoundError('userId doesnt exist for given fxaId 9999'),
      );
    });
  });
});

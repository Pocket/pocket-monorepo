import { ForbiddenError } from '@pocket-tools/apollo-utils';
import { IContext } from '../context.js';
import { deleteUserByFxaId, updateUserEmailByFxaId } from './mutations.js';
describe('Mutations', () => {
  describe('by FxA ID', () => {
    const context: IContext = { fxaUserId: '123' } as unknown as IContext; // just need userId
    it('should throw error for deleteUserByFxaId if ID != userid in headers', async () => {
      const forbiddenError = new ForbiddenError(
        'FxA user id mismatch in deletion',
      );
      await expect(
        deleteUserByFxaId('', { id: '999' }, context),
      ).rejects.toEqual(forbiddenError);
    });
    it('should throw error for updateEmailByFxaId if ID != userid in headers', async () => {
      const forbiddenError = new ForbiddenError(
        `FxA user id mismatch in update email`,
      );
      await expect(
        updateUserEmailByFxaId('', { id: '999', email: 'abc@def' }, context),
      ).rejects.toEqual(forbiddenError);
    });
  });
});

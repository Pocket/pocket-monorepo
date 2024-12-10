import { FxaRevoker } from './FxaRevoker';

describe('FxARevoker', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe('with an access token', () => {
    beforeEach(() => {
      jest
        .spyOn(FxaRevoker.prototype, 'fetchAccessToken')
        .mockResolvedValue('accessme123');
    });
    it('returns false if revoking throws an error', async () => {
      jest
        .spyOn(FxaRevoker.prototype, 'requestRevokeToken')
        .mockRejectedValueOnce(new Error('error fetching'));
      const res = await new FxaRevoker('abc123').revokeToken();
      expect(res).toBeFalse();
    });
    it('returns false if revoking response is not ok', async () => {
      jest
        .spyOn(FxaRevoker.prototype, 'requestRevokeToken')
        .mockResolvedValueOnce(new Response(null, { status: 500 }));
      const res = await new FxaRevoker('abc123').revokeToken();
      expect(res).toBeFalse();
    });
    it('returns false if db delete method throws error', async () => {
      jest
        .spyOn(FxaRevoker.prototype, 'deleteAuthRecord')
        .mockRejectedValueOnce(new Error('error deleting'));
      const res = await new FxaRevoker('abc123').revokeToken();
      expect(res).toBeFalse();
    });
    it('returns true if process does not error', async () => {
      jest
        .spyOn(FxaRevoker.prototype, 'requestRevokeToken')
        .mockResolvedValueOnce(new Response(null, { status: 200 }));
      jest
        .spyOn(FxaRevoker.prototype, 'deleteAuthRecord')
        .mockResolvedValueOnce(1);
      const res = await new FxaRevoker('abc123').revokeToken();
      expect(res).toBeTrue();
    });
  });
  it('returns true if no FxA tokens exist', async () => {
    jest
      .spyOn(FxaRevoker.prototype, 'fetchAccessToken')
      .mockResolvedValueOnce(undefined);
    const res = await new FxaRevoker('abc123').revokeToken();
    expect(res).toBeTrue();
  });
});

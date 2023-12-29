import {
  SharedUrlsResolverRepository,
  getSharedUrlsResolverRepo,
} from '../database/mysql';

describe('SharedUrls', () => {
  let sharedRepo: SharedUrlsResolverRepository;

  beforeAll(async () => {
    sharedRepo = await getSharedUrlsResolverRepo();
  });

  afterAll(async () => {
    await sharedRepo.clear();
  });

  it('should be able to insert a new shared url and get it', async () => {
    const id = await sharedRepo.addToShareUrls(1, 1, 'https://www.google.com');
    expect(id).toBe(1); //one coz auto-increment
    const result = await sharedRepo.getShareUrls(1);
    expect(result).not.toBeNull();
    expect(result.itemId).toBe(1);
    expect(result.resolvedId).toBe(1);
    expect(result.givenUrl).toBe('https://www.google.com');
  });
});

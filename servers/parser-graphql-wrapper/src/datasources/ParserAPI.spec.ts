describe('ParserAPI', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.runAllTimers();
    jest.useRealTimers();
  });
});

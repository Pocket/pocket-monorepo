export const config = {
  sentry: {
    dsn: process.env.CORPUS_SEARCH_SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  apiEndpoint:
    process.env.CORPUS_SEARCH_HOST || 'http://localhost:4566/user-list-search',
  indexLangMap: {
    en: 'corpus_en',
    it: 'corpus_it',
    es: 'corpus_es',
    fr: 'corpus_fr',
    de: 'corpus_de',
  },
  // Mapping of letter grade to numeric
  gradeRankMap: {
    a: 1,
    b: 2,
    c: 3,
  },
};

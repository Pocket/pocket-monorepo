export const config = {
  sentry: {
    dsn: process.env.CORPUS_SEARCH_SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  apiEndpoint:
    process.env.CORPUS_SEARCH_HOST || 'http://localhost:4566/user-list-search',
  indexLangMap: {
    en: process.env.CORPUS_INDEX_EN || 'corpus_en_luc',
    it: process.env.CORPUS_INDEX_IT || 'corpus_it',
    es: process.env.CORPUS_INDEX_ES || 'corpus_es',
    fr: process.env.CORPUS_INDEX_FR || 'corpus_fr',
    de: process.env.CORPUS_INDEX_DE || 'corpus_de',
  },
  // Mapping of letter grade to numeric
  gradeRankMap: {
    a: 1,
    b: 2,
    c: 3,
  },
};

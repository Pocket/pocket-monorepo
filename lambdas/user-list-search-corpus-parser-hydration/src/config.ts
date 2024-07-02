export const config = {
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  parser: {
    timeout: 10,
    retries: 3,
  },
  esEndpoint:
    process.env.ELASTICSEARCH_HOST || 'http://localhost:4566/user-list-search',
  parserEndpoint: process.env.PARSER_ENDPOINT || 'https://parser.com/text',
  privilegedServiceId: process.env.PARSER_PRIVILEGED_SERVICE_ID || 'abc-123',
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

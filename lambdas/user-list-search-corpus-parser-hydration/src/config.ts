export const config = {
  sentry: {
    dsn: process.env.CORPUS_SEARCH_SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  parser: {
    timeout: 10,
    retries: 3,
  },
  sagemakerEndpoint: process.env.EMBEDDINGS_ENDPOINT,
  esEndpoint:
    process.env.CORPUS_SEARCH_HOST || 'http://localhost:4566/user-list-search',
  parserEndpoint: process.env.PARSER_ENDPOINT || 'https://parser.com/text',
  privilegedServiceId: process.env.PARSER_PRIVILEGED_SERVICE_ID || 'abc-123',
  indexLangMap: {
    en: 'corpus_en',
    it: 'corpus_it',
    es: 'corpus_es',
    fr: 'corpus_fr',
    de: 'corpus_de',
  },
  embeddingsEnabled:
    process.env.EMBEDDINGS_ENDPOINT != null &&
    process.env.EMBEDDINGS_ENDPOINT.length > 0,
  langSupportsEmbeddings: {
    en: true,
    it: false,
    es: false,
    fr: false,
    de: false,
  },
  // Mapping of letter grade to numeric
  gradeRankMap: {
    a: 1,
    b: 2,
    c: 3,
  },
};

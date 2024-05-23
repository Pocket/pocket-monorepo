export const config = {
  apiEndpoint:
    process.env.ELASTICSEARCH_HOST || 'http://localhost:4566/user-list-search',
  indexLangMap: {
    en: 'corpus_en',
    it: 'corpus_it',
    es: 'corpus_es',
    fr: 'corpus_fr',
    de: 'corpus_de',
  },
};

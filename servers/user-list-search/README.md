# Search API

This subgraph handles search in Pocket. We provide APIs which enable search and discovery of a user's personal Pocket List, and the Pocket Corpus.

## Premium Search (user-owned content)

We provide an API for full text search on opensearch (compatible with elasticsearch). See the [studio](https://studio.apollographql.com/graph/pocket-client-api/variant/current/home) for documentation on the APIs provided. When a Pocket User converts to premium, and when a Premium User takes action on items in their list (e.g. saving a new item, making updates to an item, deleting an item), we update their indices on opensearch. This allows a user to search for terms in their list, with a number of filters to help find relevant results (e.g. tags, domain, title-specific search, etc.).

## Free-tier Search (user-owned content)

We provide an API for free-tier users. This more limited API is limited to title and URL strings and is done on the database records. It is limited to 'like' statements and does not perform stemming/tokenization/etc.

## Corpus Search (Pocket-curated content)

[WIP]

## Opensearch cluster

See `pocket-monorepo/infrastructure/user-list-search` for the infrastructure configuration. The cluster is behind a VPN, so in order to connect to it directly (e.g. via kibana console), you will have to connect to the VPN first.

`pocket-monorepo/.docker/aws-resources/elasticsearch` contains index mappings for running the search cluster locally, which mirror the configuration used in production. To get information about the indices from the production endpoint, you can connect to the VPN and make requests directly to the cluster:

See the [opensearch](https://opensearch.org/docs/latest/api-reference) or [elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/7.17/elasticsearch-intro.html) API documentation for up-to-date documentation on the available REST APIs. We use opensearch, but the elasticsearch APIs should still be supported.

```
# SEARCH_HOST environment variable is configured to the cluster host endpoint

# Get a summary of all indices
curl -X GET "${SEARCH_HOST}/_cat/indices"

# Get information about a specific index or index-pattern, with pretty formatting
(in this case, the corpus indices)
curl -X GET "${SEARCH_HOST}/_cat/indices/corpus*?v=true&s=index&pretty"

# Get information about an index mapping (in this case, the corpus_en index)
curl -X GET "${SEARCH_HOST}/corpus_en/_mapping?pretty"
```

## Opensearch indexing

### User (list) data

"Premium search" is a feature that allows full-text searching on content that a premium-tier Pocket user has saved to their list in Pocket.

Currently, events originate with the kinesis unified events stream. This stream has events for actions which trigger index behavior, e.g. saving a new item, becoming a premium user, or deleting a Pocket account. A listener filters events from this kinesis stream and puts messages on an SQS queue, which fans out into a number of behavior-specific queues (backfill, update, delete, etc.) that eventually result in actions on the search cluster. The server itself handles these requests; lambda functions which listen to the queues call the appropriate HTTP API which the server provides.

### Corpus data

The Pocket Corpus describes human-curated/approved recommendations (e.g. for new tab), collections, and the individual "stories" in a collection. We curate content in a number of different languages, for which we provide language-specific indices. This allows us to leverage elasticsearch's automatic language analyzers (which implements features like stemming, stopword removal, etc.) for more effective and relevant search results.

Corpus data originates at the (default) event bus in AWS. The corpus service emits events as curators make changes to the corpus (e.g. adding new collections, recommendations, or making changes to existing recommendations). Through event rules we fan out these events with an SNS/SQS pattern. Once the events are pushed onto the SQS queue, they are consumed by lamba functions which perform bulk index actions.

## Even emission

### Generate Snowtypes

We use the types generated from snowtype to make sure our events adhere to a single schema (events emitted here are consumed by others downstream). We decided to just use snowplow event schema because the main consumer of events is snowplow (and we can generate the types from a central source of truth), but technically any consistent schema would do (e.g. the event bridge schema registry used in some other services).

The generated files contain trackers we don't use, but it's a fine tradeoff until perhaps snowplow adds support for just generating types.

To build the types, generate an API Key at <https://console.snowplowanalytics.com/credentials> then do the following:

```bash
export SNOWPLOW_CONSOLE_API_KEY=<key here>
cd user-list-search
pnpm snowtype:generate
```

If new event structures are added they need to be included in the snowtype.config.json; See <https://docs.snowplow.io/docs/collecting-data/code-generation/using-the-cli/>. We include the minimum required structures for this repository, although more exist in snowplow.

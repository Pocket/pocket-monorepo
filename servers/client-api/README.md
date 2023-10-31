# Client API
[Service Docs](https://getpocket.atlassian.net/wiki/spaces/PE/pages/1543995452/Pocket+Graph+Gateway)

## Prerequisites

Install the following if you don't already have them.

- [docker](https://www.docker.com/)
- [rover cli](https://www.apollographql.com/docs/rover/getting-started)


To get the federated schema for this service from the [Apollo Studio](https://studio.apollographql.com/), you need an API key. 
- Obtain an API key from https://engine.apollographql.com/user-settings
- Set an environment variable named `APOLLO_KEY` and assign your API key to it before starting this service. 

You can also authenticate `rover` directly using your API key with [`rover config auth`](https://www.apollographql.com/docs/rover/configuring).

## <a name="starting"></a> Running the service locally

You can run this service locally using a subgraph definition defined in `local-supergraph-config.yaml`. This file can point to subgraphs running locally or in production. 

**Note**: To use production subgraphs, you must be logged into the Pocket Production VPN. 

### Composing the supergraph in YAML

Point to the subgraphs you want to use by updating `local-supergraph-config.yaml`. Reference entries are in that file, commented out. Here's an example:

  ```yaml
  federation_version: 2
  subgraphs:
    parser:
      routing_url: http://localhost:4001
      schema:
        subgraph_url: http://localhost:4001
  ```

See the [rover docs](https://www.apollographql.com/docs/rover/commands/supergraphs/#composing-a-supergraph-schema) for a complete reference on supergraph yaml syntax.

### Working with locally hosted subgraphs (federated services)
- Clone the repository of the subgraph(s) you intend to work with
- Start the local subggraph service(s), ensure that they are fully up and running at an endpoint
- Grab the subgraph(s) endpoint(s) and update the `local-supergraph-config.yaml` file as shown above.
- Start or restart the local `client-api` service (see below)

### Starting the service

- Run `npm ci` to install the project dependencies
- Run `docker-compose up` to start the memcache container. Add the `-d` option to run the container in the background
- Run `npm run start:local` to start the application


All requests through this gateway will  resolve to the services you specified in the 
yaml subgraph spec. The app will pick up code changes, but you'll need to kill and restart to update the subgraph spec.

## Gotchas
- This service uses memcache to cache query and mutation responses. If you are getting the same results when you expect something else, there's a good chance that the response is cached.
  - The easiest way to get around this is to flush the cache with `echo 'flush_all' | nc localhost 11211`
  - Restarting the memcache container also works to flush the cache

## Client API Schema/Naming Conventions

The general principles guiding these are:
* What are GraphQ's own recommendations (Looking at http://spec.graphql.org/)
* What are the industry standards or standards used by the tools we use (Such as Apollo's recommendations: https://www.apollographql.com/docs/apollo-server/schema/schema/#naming-conventions)
* What will have the best compatibility with naming conventions in languages that our primary consumers of the API (apps) will use, to reduce likelihood of them having to rename or adapt them.

### Casing

Use `PascalCase` for:
* Definition names. Such as the names of types, enums, scalars, unions etc. (except directives, see below)

Use `camelCase` for:
* Field names
* Argument names
* Query and Mutation names
* Directive names

Use `ALL_CAPS` for:
* Enum options


### Acronyms & Abbreviations

For words like URL, HTTP, HTML, etc, do not uppercase all letters, just follow casing rules above. 

Some examples:

For types:
* URL would be `Url`
* HTML would be `Html`
* ArticleHTML would be `ArticleHtml`

For fields:
* URL would be `url`
* articleURL would be `articleUrl`
* itemID would be `itemId`

For enums however, everything is already capitalized:
* URL would be `URL`
* articleURL would be `ARTICLE_URL`



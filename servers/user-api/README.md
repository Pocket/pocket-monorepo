# user-api

### Running queries

This service requires auth. Being an Implementing Service (subgraph), it receives request headers from the Gateway. For the context of this service, the `userid` header is required to indicate an authenticated request.

So in order to test operations in this service using the GraphQL playground, the `userid` header **MUST** be set in the `HTTP_HEADERS` panel

```json
{
  "userid": "12345"
}
```

### Run test suites

#### Unit tests

From the repo root

```
$ npm ci
$ npm run test
```

#### Functional/Integration tests

Currently, our functional tests require a mysql database backend. This is included in the docker-compose.yml for deploying the app. In the future, we'll probably update to use a docker flow specific for testing.

```
$ npm ci
$ docker compose up
$ npm run test-integrations
$ docker compose down
```

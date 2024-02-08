# v3-Proxy-Api
wrapper to connect the v3 endpoints to pocket graph v1 
- endpoints to be covered `add`, `send`, and `get`

## Folder structure

- the infrastructure code is present in `.aws`
- the application code is in `src`
- `.circleci` contains circleCI setup

## Develop Locally
```js
nvm use
npm ci
docker-compose up
```

## Run tests
```js
npm run test
npm run test-integrations
```

### Using Docker

```bash
npm ci
docker-compose up
```

### Not Using Docker

Alternatively if you do not need to use the docker services in your app, like snowplow, you can do:

```bash
npm ci
npm run start:dev
```

### To pull latest graphQL types

Our graphQL types are generated from the pocket graph v1 schema. 
To pull the latest types, run:
```js
npm run codegen
```

## To add new graphQL type
- Add your graphQL query or mutation to `src/graphql/queries/` folder
- Run `npm run codegen`
- This will generate types in `src/generated/graphql/types.ts`
- For example, if you add a new query `getSavedItems`, you will see a new type `GetSavedItemsQuery` in `src/generated/graphql/types.ts`
  - Likewise, if you passed any input variables to the query, you will see a new type `GetSavedItemsQueryVariables` in `src/generated/graphql/types.ts` 

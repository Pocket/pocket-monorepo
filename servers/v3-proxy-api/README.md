# v3-Proxy-Api

wrapper to connect the [v3 endpoints](getpocket.com/developer) to pocket graph v1

- endpoints to be covered `add`, `send`, and `get`

## Folder structure

- the infrastructure code is present in `../../infrastructure/v3-proxy-api`
- the application code is in `./src`

## Develop Locally

From the root directory.

```bash
nvm use
pnpm i
docker-compose up -d
pnpm dev --filter=v3-proxy-api...
```

## Run tests

From the root directory.

```bash
pnpm test --filter=v3-proxy-api...
pnpm test-integrations --filter=v3-proxy-api...
```

### To pull latest graphQL types

Our graphQL types are generated from the pocket graph v1 schema.

First you'll have to make sure that rover is set up appropriately, which will require creating or requesting an API key for the Pocket Graph. Once you have it, see instructions for configuring Rover on Apollo's [docs](https://www.apollographql.com/docs/rover/configuring/).

Then to pull the latest types run the command below from the root directory.

```bash
pnpm prebuild --filter=v3-proxy-api...
```

## To add new graphQL type

- Add your graphQL query or mutation to `src/graphql/queries/` folder
- Run `pnpm prebuild --filter=v3-proxy-api...`
- This will generate types in `src/generated/graphql/types.ts`
- For example, if you add a new query `getSavedItems`, you will see a new type `GetSavedItemsQuery` in `src/generated/graphql/types.ts`
  - Likewise, if you passed any input variables to the query, you will see a new type `GetSavedItemsQueryVariables` in `src/generated/graphql/types.ts`

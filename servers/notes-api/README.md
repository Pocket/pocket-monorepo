# Notes API

The API that manages the ability to create notes in Pocket.

## Application Overview

[Express](https://expressjs.com/) is the Node framework, [Apollo Server](https://www.apollographql.com/docs/apollo-server/) is used in Express to expose a GraphQL API, [Prisma](https://www.prisma.io/) is used for DB migrations, and [Kysely](https://kysely.dev/) is the type-safe query builder. [Postgres](https://www.postgresql.org/) is the relational database, though in AWS this is [Aurora Serverless](https://aws.amazon.com/rds/aurora/serverless/).

### Fresh Setup

Start Docker container:

- `docker compose up`

Prepare Prisma and Kysely:

- `cd servers/notes-api`
- `pnpm install`
- `pnpx prisma generate` (this generates Kysely Typescript types from the Prisma schema file)

Once all the Docker containers are up and running, you should be able to reach the Notes API at `http://localhost:4032/`

<!-- Out of the box, the local installation doesn't have any actual data for you to fetch or manipulate through the API. To seed some sample data for your local dev environment, run

```bash
docker compose exec app npx prisma migrate reset
```

Note that the above command will not be adding to any data you may have added to the database through other means - it will do a complete reset AND apply the seed script located at `src/prisma/seed.ts`. -->

### Adding a Migration

If you need to change the Prisma schema (in `prisma/schema.prisma`), you'll need to create a migration to ensure the database is in sync.

There are two ways to to this:

#### SQL-First

This method does not require you to learn any Prisma-specific syntax and is useful for those who are already comfortable with SQL. First, create an empty migration:

```bash
pnpm run migrate:create
```

After following the naming prompt, you should see a new folder in `prisma/migrations`. Edit the empty `migration.sql` file to create your desired migration. When you're finished, apply the migration and update the Prisma schema and types with:

```bash
pnpm run migrate:dev
# Update prisma.schema from the database directly
pnpm run prisma:pull
# Regenerate types from prisma.schema
pnpm run prisma:generate
```

#### Prisma-First

Update `prisma/schema.prisma` for your desired migration, then run:

```bash
pnpm run migrate:dev --name some_meaningful_migration_name
```

This will create a migration script in `prisma/migrations` and will automatically run the new migration. This will also re-create your Prisma Typescript types.

#### Re-creating Prisma Typescript Types

If your local environment gets messed up (it happens - for example switching to a branch with a different prisma schema), you can re-create your Prisma Typescript types by running `pnpm run prisma:generate`. If it gets really messed up, you can reset the database and reapply all migrations with `pnpm run migrate:reset`.

### Running Tests

We have two test commands, one for unit/functional tests and one for integration tests. These are both run by [Jest](https://jestjs.io/) and are differentiated by file names. Any file ending with `.spec.ts` will be run in the unit/functional suite, while integration tests should have the `.integration.ts` suffix.

Test are run via `pnpm` commands:

- Unit tests:

```bash
pnpm test
```

- Integration/functional tests:

If you've already applied your Prisma migrations and the Docker container is running, you can save time and run tests from the `/servers/notes-api` directory like:

```bash
pnpm run test-integrations
```

Otherwise, you can run from the root directory `pocket-monorepo` (ensure Docker container is running), and automatically run all prerequesite scripts:

```bash
pnpm run test-integrations --filter=notes-api
```

## Resetting Dev

There may come a time when you need to reset the Dev environment.

For example, if you were testing a schema change and then want to test a different branch without that schema change, the Dev database and Prisma schema will be out of sync.
Another common scenario is the need to reset all test data to the initial seed data provided by the seed script.

To reset the Dev database, [follow the instructions in Confluence](https://getpocket.atlassian.net/wiki/spaces/PE/pages/2938273799/Resetting+Data+for+a+Prisma-based+Subgraph+on+Dev).

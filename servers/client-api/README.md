## What's included

- `config/router.yaml`—[configuration for the router](https://www.apollographql.com/docs/router/configuration/overview)
- `Dockerfile`—used to build the router for deployment
- `.apollo`—contains some JSON schemas for the config files (to make IDE experience better)
- `.vscode`—contains recommended VS Code settings
- `.idea`—contains recommended Jetbrains editor settings
- `renovate.json`—configured to keep Router up to date
- A **sample** `config/supergraph.yaml` file for testing Router via [`rover dev`][Rover]. You'll need to update this file to point at the local versions of your subgraphs.
- `rhai` - Contains Rhai scripts for processing and forwarding certain request headers, and for forwarding JWT claims as headers to the subgraphs

## Commands

- `docker build -t router .` builds the router image with the tag `router` for local testing.
- `rover dev --supergraph-config supergraph.yaml --router-config router.yaml` to run the Router locally without Docker (using [Rover]). You'll need to update the `supergraph.yaml` file to point at the local versions of your subgraphs. **Make sure to set the required environment variables ahead of time!**
- `docker run -it --env APOLLO_KEY --env APOLLO_GRAPH_REF -p4000:4000 router` runs the same router image you'll run in production. You can now query the router at `http://localhost:4000`.
  - Make sure to set the env vars `APOLLO_KEY` and `APOLLO_GRAPH_REF` first
  - You can alternatively create a file (e.g., `.env`) and run `docker run -it --env-file .env -p4000:4000 router`. **Make sure not to check this file into source control!**
  - Your local router will need network access to the subgraphs

[GraphOS Enterprise]: https://www.apollographql.com/docs/graphos/enterprise
[Rover]: https://www.apollographql.com/docs/rover/commands/dev

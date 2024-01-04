[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/A-6SvK?referralCode=xsbY2R)
[![](https://dcbadge.vercel.app/api/server/graphos)](https://discord.gg/graphos)

A starting point for deploying the Router via a Dockerfile using [GraphOS Enterprise].

> ⚠️This template requires [GraphOS Enterprise], if you'd like a similar template that does _not_ require an enterprise plan, please open a discussion and describe your use-case and requirements.

## What's included

- `router.yaml`—[configuration for the router](https://www.apollographql.com/docs/router/configuration/overview)
- `Dockerfile`—used to build the router for deployment
- `.apollo`—contains some JSON schemas for the config files (to make IDE experience better)
- `.vscode`—contains recommended VS Code settings
- `.idea`—contains recommended Jetbrains editor settings
- `renovate.json`—configured to keep Router up to date
- A **sample** `supergraph.yaml` file for testing Router via [`rover dev`][Rover]. You'll need to update this file to point at the local versions of your subgraphs.

## Next steps

- [ ] Deploy to your environment of choice and set up CI/CD to deploy newer versions.
    - [ ] [Set `APOLLO_KEY` and `APOLLO_GRAPH_REF` secrets in deploy](https://www.apollographql.com/docs/router/configuration/overview/#environment-variables)
- [ ] Enable Renovate on this repo to keep Router up to date
- [ ] Set up a deployment preview for PRs to changes which you can run integration tests against
- [ ] Set up secrets for each of your subgraphs so that only the routers can access them
- [ ] Disable subgraph error inclusion, sandbox, and introspection in `router.yaml` once you have everything working (you probably don't want those enabled in production)

## Commands

- `docker build -t router .` builds the router image with the tag `router` for local testing.
- `rover dev --supergraph-config supergraph.yaml --router-config router.yaml` to run the Router locally without Docker (using [Rover]). You'll need to update the `supergraph.yaml` file to point at the local versions of your subgraphs. **Make sure to set the required environment variables ahead of time!**
- `docker run -it --env APOLLO_KEY --env APOLLO_GRAPH_REF -p4000:4000 router` runs the same router image you'll run in production. You can now query the router at `http://localhost:4000`.
    - Make sure to set the env vars `APOLLO_KEY` and `APOLLO_GRAPH_REF` first
    - You can alternatively create a file (e.g., `.env`) and run `docker run -it --env-file .env -p4000:4000 router`. **Make sure not to check this file into source control!**
    - Your local router will need network access to the subgraphs


[GraphOS Enterprise]: https://www.apollographql.com/docs/graphos/enterprise
[Rover]: https://www.apollographql.com/docs/rover/commands/dev

# Annotations API

This subgraph handles Annotations on SavedItems in a User's list.

## Folder structure

- the infrastructure code is present in `.aws`
- the application code is in `src`
- `.docker` contains local setup
- `.circleci` contains circleCI setup

## Develop Locally

```bash
npm install
npm start:dev
```

## Start docker

```bash
# npm ci not required if already up-to-date
npm ci
docker compose up
```

# Braze Content Proxy API

Provides Pocket Hits stories to be consumed by Connected Content blocks in Braze.

## Application Overview

- [Express](https://expressjs.com/) is the Node framework, 
- [Apollo Client](https://www.apollographql.com/docs/react/) is used in Express to request data from 
- [Client API](https://github.com/Pocket/client-api/).
- [Pocket Image Cache](https://pocket-image-cache.com/), a Pocket service, is also used to resize image thumbnails on the fly for use in emails.

## Caching

### API-side caching

The API sets a two-minute cache on its output via a `Cache-Control` header. There is no caching of results from Client API, so any updates to curated stories and scheduling on Pocket Hits surfaces should be visible with a maximum of two-minute lag.

### Braze-side caching

Braze caches Connected Content for a minimum of five minutes (and recommends setting the value to 15 minutes): [Connected Content: Configurable Caching](https://www.braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content/local_connected_content_variables/#configurable-caching).

## Local Development

- Clone the repository:

```bash
git clone git@github.com:Pocket/braze-content-proxy.git

cd braze-content-proxy
```

- Install the packages:

```bash
npm install
```

- Start the app:

```bash
npm run start:dev
```

- Load `http://localhost:4500` in your browser. Done!

## Testing the proxy on Dev

Note that it's often more convenient to work with test data curated on Dev, so the local setup is mainly useful for running tests and lint checks. 

- Push the branch you're working on to Dev:

```bash
git push -f origin YOUR_BRANCH_HERE:dev
```
and wait for the deployment to complete (~10 minutes).

- to get scheduled items for a given day:
```bash
# params required
https://braze-content-proxy.getpocket.dev/scheduled-items/[SCHEDULED_SURFACE_GUID]/?date=[DATE_IN_YYYY-MM-DD_FORMAT]&apikey=[LOOK_UP_THE_KEY_IN_AWS]
# sample URL (don't forget to supply the API key)
https://braze-content-proxy.getpocket.dev/scheduled-items/POCKET_HITS_EN_US/?date=2022-05-27&apikey=[INSERT_API_KEY]
```
- to get a collection by slug:
```bash
# params required
https://braze-content-proxy.getpocket.dev/collection/[COLLECTION_SLUG]/?apikey=[LOOK_UP_THE_KEY_IN_AWS]
# sample URL (don't forget to supply the API key)
https://braze-content-proxy.getpocket.dev/collection/halloween-history?apikey=[LOOK_UP_THE_KEY_IN_AWS]
```


- Now you can do a sanity check for the data returned by the proxy.

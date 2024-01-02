import https from 'https';
import { config } from './config';
import * as AWSXRay from 'aws-xray-sdk-core';
import * as xrayExpress from 'aws-xray-sdk-express';
import * as Sentry from '@sentry/node';
import express, { json } from 'express';
import { EventEmitter } from 'events';
import { SqsConsumer } from './SqsConsumer';

//Set XRAY to just log if the context is missing instead of a runtime error
AWSXRay.setContextMissingStrategy('LOG_ERROR');

//Add the AWS XRAY ECS plugin that will add ecs specific data to the trace
AWSXRay.config([AWSXRay.plugins.ECSPlugin]);

//Capture all https traffic this service sends
//This is to auto capture node fetch requests (like to parser)
AWSXRay.captureHTTPsGlobal(https, true);

//Capture all promises that we make
AWSXRay.capturePromise();

// Initialize sentry
Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});
const app = express();

// JSON parser to enable POST body with JSON
app.use(json());

app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// Start polling for messages from snowplow event queue
new SqsConsumer(new EventEmitter());

//If there is no host header (really there always should be..) then use account-data-deleter-api as the name
app.use(xrayExpress.openSegment('account-data-deleter-api'));

//Set XRay to use the host header to open its segment name.
AWSXRay.middleware.enableDynamicNaming('*');

//Make sure the express app has the xray close segment handler
app.use(xrayExpress.closeSegment());

app
  .listen({ port: config.app.port }, () => {
    console.log(`🚀 Server ready at http://localhost:${config.app.port}`);
  })
  .on('error', (_error) => {
    Sentry.captureException(_error.message);
    return console.log('Error: ', _error.message);
  });

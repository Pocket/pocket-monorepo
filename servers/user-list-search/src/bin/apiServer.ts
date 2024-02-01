import AWSXRay from 'aws-xray-sdk-core';
import xrayExpress from 'aws-xray-sdk-express';
import https from 'https';
import * as Sentry from '@sentry/node';
import { config } from '../config';
import { startServer } from '../server/serverUtils';
import { serverLogger } from '@pocket-tools/ts-logger';

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

//Set XRay to use the host header to open its segment name.
AWSXRay.middleware.enableDynamicNaming('*');

startServer(4000).then(({ app, url }) => {
  app.use(xrayExpress.openSegment('user-list-search-api'));
  app.use(xrayExpress.closeSegment());
  serverLogger.info(`🚀 Public server ready at http://localhost:4000`);
});

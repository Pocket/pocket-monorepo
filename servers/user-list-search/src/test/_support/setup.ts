import AWSXRay from 'aws-xray-sdk-core';

AWSXRay.setContextMissingStrategy(() => {
  return;
});

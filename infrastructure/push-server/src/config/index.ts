const name = 'Push';
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const environment = isDev ? 'Dev' : 'Prod';
const prefix = `${name}-${environment}`;
const releaseSha = process.env.CIRCLE_SHA1;

// same in dev and prod for now.
const jobQueueName = 'pocket-push-queue';
const tokenQueueName = 'pocket-push-feedback-queue';

export const config = {
  name,
  isDev,
  isProd,
  prefix,
  jobQueueName,
  tokenQueueName,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'PUSH',
  environment,
  releaseSha,
  tags: {
    service: name,
    environment,
  },
};

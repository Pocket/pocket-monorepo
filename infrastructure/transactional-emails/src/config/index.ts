const name = 'TransactionalEmails';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';

export const config = {
  name,
  isDev,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'TRANEM',
  environment,
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Pocket',
    app_code: 'pocket',
    component_code: `pocket-${name.toLowerCase()}`,
    env_code: isDev ? 'dev' : 'prod',
  },
  lambda: {
    braze: {
      forgotPasswordCampaignId: isDev
        ? 'e9c7ebd4-e81b-354a-673b-e0cd1b075d28'
        : '309d4141-2c47-4512-9df0-28921db49f98',
      //todo: read from ssm
      accountDeletionCampaignId: isDev
        ? '2e3050bb-da99-b1a3-e200-5939b8e07f8d'
        : '678b04d9-bce4-47f6-e833-42ec1f1b48af',
      //marketing doesnt exist in dev, reusing pocket hits weekly id for dev
      marketingEmailSubscription: isDev
        ? '99fbeac9-2fa3-496d-ab94-4e869d42e52c'
        : '3aeb7440-8865-4b80-bf13-7600bee96a59',
      listExportReadyCampaignId: isDev
        ? '45b2e986-d80b-f068-ce9f-5781296e91a4'
        : '8a5f66b9-6e28-48e9-af99-e44e2a16a81a',
    },
  },
  eventBridge: {
    prefix: 'PocketEventBridge',
    topics: [
      'UserEventTopic',
      'PremiumPurchase-Topic',
      'UserRegistrationTopic',
      'ForgotPasswordRequest-Topic',
      'ListExportReady-Topic',
    ],
  },
};

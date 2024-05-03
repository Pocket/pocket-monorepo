import { initialize, Unleash } from 'unleash-client';
import { ServerOptions } from '../index.js';
import { NewUserStrategy } from './strategy/newUser.js';
import { UserInLocaleStrategy } from './strategy/userInLocale.js';
import { NewUserInLocaleStrategy } from './strategy/newUserInLocale.js';
import { AccountAgeAtStartStrategy } from './strategy/accountAgeAtStart.js';
import { AccountAgeStrategy } from './strategy/accountAge.js';
import { HasUserModel } from './strategy/hasUserModel.js';

export interface ClientContext {
  unleash: Unleash;
}

const DEFAULT_OPTS: ServerOptions = {
  port: 4242,
  featureStoreRefresh: 60,
};

let unleashClient: Unleash;

/**
 * Sets the global unleash client.
 * @param unleash
 * @param opts
 */
export const setUnleash = (opts?: ServerOptions): ClientContext => {
  opts = opts ?? {};
  const port = opts.port ?? DEFAULT_OPTS.port;

  //Initialize an Unleash Node Client but use our local repository instead of making the usual api calls.
  unleashClient = initialize({
    url: `http://localhost:${port}/api/`, //It should not make an api call other then to register itself.
    appName: 'Unleash Server',
    environment: process.env.NODE_ENV,
    disableMetrics: true, // It is up to clients to implement metrics.
    refreshInterval: 1000, //This wont be used.
    strategies: [
      new UserInLocaleStrategy(),
      new NewUserInLocaleStrategy(),
      new NewUserStrategy(),
      new AccountAgeAtStartStrategy(),
      new AccountAgeStrategy(),
      new HasUserModel(),
    ],
  });

  return { unleash: unleashClient };
};

/**
 * Gets the global unleash client.
 */
export const getUnleashClient = (): Unleash => unleashClient;

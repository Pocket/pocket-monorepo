import passport from 'passport';
import AuthenticationRequired from 'unleash-server/dist/lib/types/authentication-required';
import { Application } from 'express';
import { IUnleashServices } from 'unleash-server/dist/lib/types/services';
import { IUnleashConfig } from 'unleash-server/dist/lib/types/option';
import appConfig from '../config';
import { RoleName } from 'unleash-server';
import { Strategy as OidcStrategy } from '@techpass/passport-openidconnect';

/**
 * Adds admin authentication to our admin application. Concepts taken from https://github.com/Unleash/unleash-examples/blob/main/v4/securing-google-auth/google-auth-hook.js
 * The middleware here will validate a JWT token from AWS Cognito and auth a user if they have access to the group
 */
export const enableJwtAuth = (
  app: Application,
  config: IUnleashConfig,
  services: IUnleashServices,
): void => {
  const { userService } = services;

  passport.use(
    new OidcStrategy(
      {
        authorizationURL: appConfig.oauth.authorizationURL,
        tokenURL: appConfig.oauth.tokenURL,
        userInfoURL: appConfig.oauth.userInfoURL,
        issuer: appConfig.oauth.issuer,
        clientID: appConfig.oauth.clientId,
        clientSecret: appConfig.oauth.clientSecret,
        callbackURL: appConfig.oauth.callbackURL,
        scope: 'profile email',
        pkce: 'S256',
      },
      async (
        issuer,
        sub,
        profile,
        jwtClaims,
        accessToken,
        refreshToken,
        idToken,
        params,
        done,
      ) => {
        const email = jwtClaims.email;

        //Custom claim attributes are in the OIDC payload, not in our jwtAccessTokenPayload.
        const isInMozillaIAMGroup =
          jwtClaims['custom:groups'] !== undefined &&
          JSON.parse(jwtClaims['custom:groups']).indexOf(
            appConfig.mozillaIAMAccessGroup,
          ) > 0;
        if (isInMozillaIAMGroup) {
          // TODO: once we start wanting to use new Unleash 4 RBAC we should get more specific and
          // map cognito user groups to Unleash roles and persist it back with the userService.
          const user = await userService.loginUserSSO({
            email: email,
            name: `${jwtClaims.given_name} ${jwtClaims.family_name}`,
            rootRole: RoleName.ADMIN,
            autoCreate: true,
          });
          done(null, user);
        } else {
          done(null, false);
        }
      },
    ),
  );

  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  //Setup a route that can display an error message if JWT auth fails.
  app.get(
    '/api/admin/login',
    passport.authenticate('openidconnect', { scope: ['email', 'profile'] }),
  );

  app.get(
    '/api/auth/callback',
    passport.authenticate('openidconnect'),
    (req, res) => {
      res.redirect(`/`);
    },
  );

  app.use('/api/admin/', (req, res, next) => {
    if (req.user) {
      return next();
    }
    // Instruct unleash-frontend to pop-up auth dialog
    return res
      .status(401)
      .json(
        new AuthenticationRequired({
          path: `/api/admin/login`,
          type: 'custom',
          message: `You do not currently have access to Pocket Feature Flags. Please ask a Product or Engineering Manager to add you to https://people.mozilla.org/a/pocket_featureflags/`,
        }),
      )
      .end();
  });
};

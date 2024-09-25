import passport from 'passport';
import { Application } from 'express';
import {
  type IUnleashServices,
  type IUnleashConfig,
  RoleName,
  AuthenticationRequired,
} from 'unleash-server';
import appConfig from '../config';
import {
  Strategy as OidcStrategy,
  MergedProfile,
  Profile,
  AuthContext,
  VerifyCallback,
} from '@govtechsg/passport-openidconnect';
import { decode } from 'jsonwebtoken';

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
        issuer: string,
        uiProfile: MergedProfile,
        idProfile: Profile,
        context: AuthContext,
        idToken: string,
        accessToken: string,
        refreshToken: string,
        params: any,
        done: VerifyCallback,
      ) => {
        const jwtClaims = decode(params.id_token);
        if (!jwtClaims) {
          done(null, false);
          return;
        }

        //Custom claim attributes are in the OIDC payload, not in our jwtAccessTokenPayload.
        const isInMozillaIAMGroup =
          jwtClaims['custom:groups'] !== undefined &&
          JSON.parse(jwtClaims['custom:groups']).indexOf(
            appConfig.mozillaIAMAccessGroup,
          ) > 0;
        if (
          isInMozillaIAMGroup &&
          idProfile.emails &&
          idProfile.emails.length
        ) {
          // TODO: once we start wanting to use new Unleash 4 RBAC we should get more specific and
          // map cognito user groups to Unleash roles and persist it back with the userService.
          const user = await userService.loginUserSSO({
            email: idProfile.emails[0].value,
            name: uiProfile.displayName,
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
  passport.deserializeUser((user: Express.User, done) => done(null, user));

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

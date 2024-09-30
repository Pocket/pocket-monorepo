import * as Sentry from '@sentry/node';
import http from 'http';

/**
 * Sets common variables for Sentry tracing
 * Usage:
 * ```ts
 * app.use(sentryPocketMiddleware)
 * ```
 * @param req Express request
 */
export const sentryPocketMiddleware = (
  req: http.IncomingMessage,
  _: http.ServerResponse,
  next: (error?: any) => void,
) => {
  const scope = Sentry.getCurrentScope();
  // Set tracking data for Sentry
  scope.setUser({
    id: (req.headers.encodedid as string) || undefined,
    // First use the cloudfront viewer address that has been passwed through, which is always the end user (direct from our CDN https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-cloudfront-headers.html),
    //   We also need to split the port off because amazon passes that through as well.
    // then the gateway ip address which may come from web repo via x-forwaded-for
    // then the origin client ip which may be added by the alb
    ip_address:
      (req.headers['CloudFront-Viewer-Address'] as string)?.split(':')[0] ||
      (req.headers.gatewayipaddress as string) ||
      (req.headers['origin-client-ip'] as string) ||
      undefined,
  });
  scope.setTag('pocket-api-id', (req.headers.apiid || '0') as string);
  next();
};

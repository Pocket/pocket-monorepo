import {
  ApplicationBaseDNS,
  ApplicationCertificate,
} from '@pocket-tools/terraform-modules';
import { Construct } from 'constructs';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import {
  CloudfrontDistributionOrderedCacheBehavior,
  CloudfrontDistribution,
} from '@cdktf/provider-aws/lib/cloudfront-distribution';

export interface ClickTrackingDomainConfig {
  tags?: { [key: string]: string };
  domain: string;
  clickTrackingOrigin: string;
  wellKnownStorageDomain: string;
}

interface RootZoneConfig {
  tags?: { [key: string]: string };
  domain: string;
}

interface SSLCertificateConfig extends RootZoneConfig {
  baseDNS: ApplicationBaseDNS;
}

interface ClickTrackingCDNConfig extends RootZoneConfig {
  clickTrackingOrigin: string;
  sslCertificate: ApplicationCertificate;
  wellKnownStorageDomain: string;
}

const defaultWellKnownBehavior: Omit<
  CloudfrontDistributionOrderedCacheBehavior,
  'targetOriginId' | 'pathPattern'
> = {
  viewerProtocolPolicy: 'https-only',
  compress: true,
  allowedMethods: ['GET', 'HEAD'],
  cachedMethods: ['GET', 'HEAD'],
  forwardedValues: {
    queryString: false,
    cookies: {
      forward: 'none',
    },
  },
  smoothStreaming: false,
};

/**
 *
 */
export class ClickTrackingDomain extends Construct {
  constructor(
    scope: Construct,
    name: string,
    config: ClickTrackingDomainConfig,
  ) {
    super(scope, name);

    const zone = this.createRootZone({
      domain: config.domain,
      tags: config.tags,
    });
    const sslCertificate = this.createSSLCertificate({
      domain: config.domain,
      tags: config.tags,
      baseDNS: zone,
    });
    const clickTrackingCDN = this.createClickTrackingCDN({
      domain: config.domain,
      tags: config.tags,
      clickTrackingOrigin: config.clickTrackingOrigin,
      sslCertificate,
      wellKnownStorageDomain: config.wellKnownStorageDomain,
    });

    this.createCDNAlias(zone, clickTrackingCDN);
  }

  /**
   * Creates the main DNS Zone
   * @param zone
   * @private
   */
  private createRootZone(zone: RootZoneConfig): ApplicationBaseDNS {
    //Setup the Base DNS stack for our application which includes a hosted SubZone
    return new ApplicationBaseDNS(this, `base_dns`, {
      domain: zone.domain,
      tags: zone.tags,
    });
  }

  /**
   * Create an SSL Certificate for the domain
   * @param sslCertificateConfig
   * @private
   */
  private createSSLCertificate(
    sslCertificateConfig: SSLCertificateConfig,
  ): ApplicationCertificate {
    //Creates the Certificate for the domain
    return new ApplicationCertificate(this, `email_certificate`, {
      zoneId: sslCertificateConfig.baseDNS.zoneId,
      domain: sslCertificateConfig.domain,
      tags: sslCertificateConfig.tags,
    });
  }

  /**
   * Creates a CDN that is used to track clicks into Braze
   * Braze points to other providers for setup instructions:
   * https://support.sparkpost.com/docs/tech-resources/enabling-https-engagement-tracking-on-sparkpost/#step-by-step-guide-with-aws-cloudfront
   * @private
   */
  private createClickTrackingCDN(
    config: ClickTrackingCDNConfig,
  ): CloudfrontDistribution {
    return new CloudfrontDistribution(this, `cloudfront_distribution`, {
      comment: `ClickTracking CDN for ${config.domain}`,
      enabled: true,
      aliases: [config.domain],
      priceClass: 'PriceClass_All',
      tags: config.tags,
      origin: [
        {
          domainName: config.clickTrackingOrigin,
          originId: config.clickTrackingOrigin,
          customOriginConfig: {
            originProtocolPolicy: 'https-only',
            httpPort: 80,
            httpsPort: 443,
            originSslProtocols: ['TLSv1.2'],
          },
        },
        {
          //Create an origin that maps to where we store the .well-known files.
          domainName: config.wellKnownStorageDomain,
          originId: config.wellKnownStorageDomain,
          customOriginConfig: {
            originProtocolPolicy: 'https-only',
            httpPort: 80,
            httpsPort: 443,
            originSslProtocols: ['TLSv1.2'],
          },
        },
      ],
      orderedCacheBehavior: [
        {
          ...defaultWellKnownBehavior,
          targetOriginId: config.wellKnownStorageDomain,
          pathPattern: 'apple-app-site-association',
        },
        {
          ...defaultWellKnownBehavior,
          targetOriginId: config.wellKnownStorageDomain,
          pathPattern: '.well-known/apple-app-site-association',
        },
        {
          ...defaultWellKnownBehavior,
          targetOriginId: config.wellKnownStorageDomain,
          pathPattern: '.well-known/assetlinks.json',
        },
      ],
      defaultCacheBehavior: {
        targetOriginId: config.clickTrackingOrigin,
        viewerProtocolPolicy: 'allow-all',
        compress: true,
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        forwardedValues: {
          queryString: true,
          headers: ['*'],
          cookies: {
            forward: 'none',
          },
        },
        smoothStreaming: false,
      },
      viewerCertificate: {
        acmCertificateArn: config.sslCertificate.arn,
        sslSupportMethod: 'sni-only',
        minimumProtocolVersion: 'TLSv1.1_2016',
      },
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
      dependsOn: [config.sslCertificate.certificateValidation],
    });
  }

  /**
   * Creates the main DNS Zone
   * @param zone
   * @param cdn
   * @private
   */
  private createCDNAlias(
    zone: ApplicationBaseDNS,
    cdn: CloudfrontDistribution,
  ): Route53Record {
    //Setup the Base DNS stack for our application which includes a hosted SubZone
    return new Route53Record(this, `cdn_route53_alias`, {
      zoneId: zone.zoneId,
      name: '',
      type: 'A',
      alias: {
        name: cdn.domainName,
        zoneId: cdn.hostedZoneId,
        evaluateTargetHealth: false,
      },
    });
  }
}

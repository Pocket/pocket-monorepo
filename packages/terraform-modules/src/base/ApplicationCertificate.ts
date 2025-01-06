import {
  route53Record,
  dataAwsRoute53Zone,
  acmCertificateValidation,
  acmCertificate,
} from '@cdktf/provider-aws';
import { TerraformMetaArguments, TerraformProvider } from 'cdktf';
import { Construct } from 'constructs';

export interface ApplicationCertificateProps extends TerraformMetaArguments {
  domain: string;
  /**
   * If zoneId is not passed then we use a data block and the zoneDomain to grab it.
   */
  zoneId?: string;
  zoneDomain?: string;
  tags?: { [key: string]: string };
}

/**
 * Generates an Application Certificate given a domain name and zoneId
 */
export class ApplicationCertificate extends Construct {
  public readonly arn: string;
  // Use `certificateValidation` in `dependsOn` to block on the
  // complete certificate for any downstream dependencies
  public readonly certificateValidation: acmCertificateValidation.AcmCertificateValidation;

  constructor(
    scope: Construct,
    name: string,
    config: ApplicationCertificateProps,
  ) {
    super(scope, name);

    if (!config.zoneId && config.zoneDomain) {
      const route53Zone = new dataAwsRoute53Zone.DataAwsRoute53Zone(
        this,
        `zone`,
        {
          name: config.zoneDomain,
          provider: config.provider,
        },
      );
      config.zoneId = route53Zone.zoneId;
    } else if (!config.zoneId && !config.zoneDomain) {
      throw new Error('You need to pass either a zone id or a zone domain');
    }

    const certificate = ApplicationCertificate.generateAcmCertificate(
      this,
      config.domain,
      config.tags,
      config.provider,
    );

    if (config.zoneId === undefined) {
      throw new Error('No zone id provided or found');
    }

    const certificateRecord = ApplicationCertificate.generateRoute53Record(
      this,
      config.zoneId,
      certificate,
      config.provider,
    );

    const validation = ApplicationCertificate.generateAcmCertificateValidation(
      this,
      certificate,
      certificateRecord,
      config.provider,
    );

    this.arn = certificate.arn;
    this.certificateValidation = validation;
  }

  static generateAcmCertificate(
    scope: Construct,
    domain: string,
    tags?: { [key: string]: string },
    provider?: TerraformProvider,
  ): acmCertificate.AcmCertificate {
    return new acmCertificate.AcmCertificate(scope, `certificate`, {
      domainName: domain,
      validationMethod: 'DNS',
      tags: tags,
      lifecycle: {
        createBeforeDestroy: true,
      },
      provider: provider,
    });
  }

  static generateRoute53Record(
    scope: Construct,
    zoneId: string,
    cert: acmCertificate.AcmCertificate,
    provider?: TerraformProvider,
  ): route53Record.Route53Record {
    const record = new route53Record.Route53Record(
      scope,
      `certificate_record`,
      {
        name: cert.domainValidationOptions.get(0).resourceRecordName,
        type: cert.domainValidationOptions.get(0).resourceRecordType,
        zoneId,
        records: [cert.domainValidationOptions.get(0).resourceRecordValue],
        ttl: 60,
        dependsOn: [cert],
        provider: provider,
      },
    );

    return record;
  }

  static generateAcmCertificateValidation(
    scope: Construct,
    cert: acmCertificate.AcmCertificate,
    record: route53Record.Route53Record,
    provider?: TerraformProvider,
  ): acmCertificateValidation.AcmCertificateValidation {
    return new acmCertificateValidation.AcmCertificateValidation(
      scope,
      `certificate_validation`,
      {
        certificateArn: cert.arn,
        validationRecordFqdns: [record.fqdn],
        dependsOn: [record, cert],
        provider: provider,
      },
    );
  }
}

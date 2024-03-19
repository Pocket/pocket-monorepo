import {
  route53Record,
  route53Zone,
  dataAwsRoute53Zone,
} from '@cdktf/provider-aws';
import { TerraformMetaArguments, TerraformProvider } from 'cdktf';
import { Construct } from 'constructs';
import { getRootDomain } from '../utilities.js';

export interface RootDNSProps extends TerraformMetaArguments {
  domain: string;
  tags?: { [key: string]: string };
}

export class ApplicationBaseDNS extends Construct {
  public readonly zoneId: string;

  constructor(scope: Construct, name: string, config: RootDNSProps) {
    super(scope, name);

    const route53MainZone = ApplicationBaseDNS.retrieveAwsRoute53Zone(
      scope,
      name,
      config.domain,
      config.provider,
    );

    const route53SubZone = ApplicationBaseDNS.generateRoute53Zone(
      this,
      config.domain,
      config.tags,
      config.provider,
    );

    this.zoneId = route53SubZone.zoneId;

    ApplicationBaseDNS.generateRoute53Record(
      this,
      config.domain,
      route53MainZone.zoneId,
      route53SubZone.nameServers,
      config.provider,
    );
  }

  static retrieveAwsRoute53Zone(
    scope: Construct,
    name: string,
    domain: string,
    provider?: TerraformProvider,
  ): dataAwsRoute53Zone.DataAwsRoute53Zone {
    return new dataAwsRoute53Zone.DataAwsRoute53Zone(
      scope,
      `${name}_main_hosted_zone`,
      {
        name: getRootDomain(domain),
        provider: provider,
      },
    );
  }

  static generateRoute53Zone(
    scope: Construct,
    domain: string,
    tags?: { [key: string]: string },
    provider?: TerraformProvider,
  ): route53Zone.Route53Zone {
    return new route53Zone.Route53Zone(scope, `subhosted_zone`, {
      name: domain,
      tags: tags,
      provider: provider,
    });
  }

  static generateRoute53Record(
    scope: Construct,
    name: string,
    zoneId: string,
    records: string[],
    provider?: TerraformProvider,
  ): void {
    new route53Record.Route53Record(scope, `subhosted_zone_ns`, {
      name,
      type: 'NS',
      ttl: 86400,
      zoneId,
      records,
      provider: provider,
    });
  }
}

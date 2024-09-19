import { Construct } from 'constructs';
import { dataAwsRoute53Zone, route53Record } from '@cdktf/provider-aws';
import { getRootDomain } from '@pocket-tools/terraform-modules';

export interface EmailSendDomainConfig {
  tags?: { [key: string]: string };
  rootDomain: string;
  subdomain: string;
  cname: string;
  mx: string;
  textRecords: { [key: string]: string[] };
  aRecords: { [key: string]: string };
  // When verifying domains initially with Braze we need to setup Root CNAMES.
  // However after we verify a CNAME we then need to remove it and replace it with text and mx records
  // that we use to verify things like Google Postmasters or Sign in With Apple.
  useRootCNAME: boolean;
}

interface RootZoneConfig {
  tags?: { [key: string]: string };
  domain: string;
}

interface TextRecordsConfig {
  baseDNS: dataAwsRoute53Zone.DataAwsRoute53Zone;
  subdomain: string;
  textRecords: { [key: string]: string[] };
}

interface ARecordsConfig {
  baseDNS: dataAwsRoute53Zone.DataAwsRoute53Zone;
  subdomain: string;
  aRecords: { [key: string]: string };
}

interface CNAMEConfig {
  baseDNS: dataAwsRoute53Zone.DataAwsRoute53Zone;
  subdomain: string;
  cname: string;
}

interface MXConfig {
  baseDNS: dataAwsRoute53Zone.DataAwsRoute53Zone;
  subdomain: string;
  mx: string;
}

/**
 *
 */
export class EmailSendDomain extends Construct {
  constructor(scope: Construct, name: string, config: EmailSendDomainConfig) {
    super(scope, name);

    const zone = this.getRootZone({
      domain: config.rootDomain,
      tags: config.tags,
    });

    if (config.useRootCNAME) {
      this.createMainCNAMERecord({
        baseDNS: zone,
        subdomain: config.subdomain,
        cname: config.cname,
      });
      //Remove any root text records, because we can not use a root text record and a root cname.
      delete config.textRecords[''];
    } else {
      this.createMXRecord({
        baseDNS: zone,
        subdomain: config.subdomain,
        mx: config.mx,
      });
    }

    this.createTextVerificationRecords({
      baseDNS: zone,
      subdomain: config.subdomain,
      textRecords: config.textRecords,
    });
    this.createARecords({
      baseDNS: zone,
      subdomain: config.subdomain,
      aRecords: config.aRecords,
    });
  }

  /**
   * Creates the main DNS Zone
   * @param zone
   * @private
   */
  private getRootZone(
    zone: RootZoneConfig,
  ): dataAwsRoute53Zone.DataAwsRoute53Zone {
    //Get the root zone for our subdomain
    //We can't make a sub hosted zone like we usually do because we need to CNAME the root record
    return new dataAwsRoute53Zone.DataAwsRoute53Zone(this, `base_dns`, {
      name: getRootDomain(zone.domain),
    });
  }

  /**
   * Creates any necessary cname record from the configuration
   * @param config
   * @private
   */
  private createMainCNAMERecord(config: CNAMEConfig) {
    return new route53Record.Route53Record(this, `cname_record`, {
      zoneId: config.baseDNS.zoneId,
      name: config.subdomain,
      type: 'CNAME',
      records: [config.cname],
      ttl: 300,
    });
  }

  /**
   * Creates any necessary mx record from the configuration
   * @param config
   * @private
   */
  private createMXRecord(config: MXConfig) {
    return new route53Record.Route53Record(this, `mx_record`, {
      zoneId: config.baseDNS.zoneId,
      name: config.subdomain,
      type: 'MX',
      records: [config.mx],
      ttl: 300,
    });
  }

  /**
   * Creates any necessary text records from the configuration
   * @param config
   * @private
   */
  private createTextVerificationRecords(config: TextRecordsConfig) {
    const records: route53Record.Route53Record[] = [];
    for (const [name, value] of Object.entries(config.textRecords)) {
      const recordName =
        name === '' ? config.subdomain : `${name}.${config.subdomain}`;
      records.push(
        new route53Record.Route53Record(
          this,
          `${records.length}_text_records`,
          {
            zoneId: config.baseDNS.zoneId,
            name: recordName,
            type: 'TXT',
            records: value,
            ttl: 300,
          },
        ),
      );
    }

    return records;
  }

  /**
   * Creates any necessary a records from the configuration
   * @param config
   * @private
   */
  private createARecords(config: ARecordsConfig) {
    const records: route53Record.Route53Record[] = [];
    for (const [name, value] of Object.entries(config.aRecords)) {
      const recordName =
        name === '' ? config.subdomain : `${name}.${config.subdomain}`;
      records.push(
        new route53Record.Route53Record(this, `${records.length}_a_records`, {
          zoneId: config.baseDNS.zoneId,
          name: recordName,
          type: 'A',
          records: [value],
          ttl: 300,
        }),
      );
    }

    return records;
  }
}

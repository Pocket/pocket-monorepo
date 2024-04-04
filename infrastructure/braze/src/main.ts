import { Construct } from 'constructs';
import { App, S3Backend, TerraformStack } from 'cdktf';
import { provider as awsProvider } from '@cdktf/provider-aws';
import { config } from './config';
import { EmailSendDomain } from './emailSendDomain';
import * as fs from 'fs';
import { ClickTrackingDomain } from './clickTrackingDomain';
import { DataExportBucket } from './dataExport';

class Braze extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new awsProvider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });

    new S3Backend(this, {
      bucket: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-pocket-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    //The domain that we send transactional email from.
    new EmailSendDomain(this, 'transactional_email', {
      rootDomain: config.rootDomain,
      subdomain: config.transactionalDomainPrefix,
      tags: config.tags,
      cname: 'sparkpostmail.com',
      mx: '10 smtp.sparkpostmail.com',
      textRecords: config.transactionalTextRecords,
      aRecords: config.transactionalARecords,
      useRootCNAME: false,
    });

    //The domain that we send marketing emails from.
    new EmailSendDomain(this, 'marketing_email', {
      rootDomain: config.rootDomain,
      subdomain: config.marketingDomainPrefix,
      tags: config.tags,
      cname: 'sparkpostmail.com',
      mx: '10 smtp.sparkpostmail.com',
      textRecords: config.marketingTextRecords,
      aRecords: config.marketingARecords,
      useRootCNAME: false,
    });

    //The domain that we send newsletter emails from.
    new EmailSendDomain(this, 'newsletter_email', {
      rootDomain: config.rootDomain,
      subdomain: config.newsletterDomainPrefix,
      tags: config.tags,
      cname: 'sparkpostmail.com',
      mx: '10 smtp.sparkpostmail.com',
      textRecords: config.newsletterTextRecords,
      aRecords: config.newsletterARecords,
      useRootCNAME: false,
    });

    //The domain that we track clicks from.
    new ClickTrackingDomain(this, 'click_tracking', {
      domain: config.clickTrackingDomain,
      tags: config.tags,
      clickTrackingOrigin: 'spgo.io',
      wellKnownStorageDomain: config.wellKnownStorageDomain,
    });

    new DataExportBucket(this, 'data_export', {
      brazeAccountId: config.brazeAccountId,
      brazeExternalId: config.brazeExternalId,
      bucket: config.brazeBucketName,
      prefix: config.prefix,
      tags: config.tags,
    });
  }
}

const app = new App();
const stack = new Braze(app, 'braze');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();

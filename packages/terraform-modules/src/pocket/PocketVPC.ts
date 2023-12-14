import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsKmsAlias } from '@cdktf/provider-aws/lib/data-aws-kms-alias';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsSecurityGroups } from '@cdktf/provider-aws/lib/data-aws-security-groups';
import { DataAwsSsmParameter } from '@cdktf/provider-aws/lib/data-aws-ssm-parameter';
import { DataAwsSubnets } from '@cdktf/provider-aws/lib/data-aws-subnets';
import { DataAwsVpc } from '@cdktf/provider-aws/lib/data-aws-vpc';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Fn } from 'cdktf';
import { Construct } from 'constructs';

export class PocketVPC extends Construct {
  public readonly vpc: DataAwsVpc;

  public readonly region: string;
  public readonly accountId: string;
  public readonly privateSubnetIds: string[];
  public readonly publicSubnetIds: string[];
  public readonly secretsManagerSecretKey: DataAwsKmsAlias;
  public readonly defaultSecurityGroups: DataAwsSecurityGroups;
  public readonly internalSecurityGroups: DataAwsSecurityGroups;

  constructor(scope: Construct, name: string, provider?: AwsProvider) {
    super(scope, name);

    const vpcSSMParam = new DataAwsSsmParameter(this, `vpc_ssm_param`, {
      provider: provider,
      name: '/Shared/Vpc',
    });

    this.vpc = new DataAwsVpc(this, `vpc`, {
      provider: provider,
      filter: [
        {
          name: 'vpc-id',
          values: [vpcSSMParam.value],
        },
      ],
    });

    const privateString = new DataAwsSsmParameter(this, `private_subnets`, {
      provider: provider,
      name: '/Shared/PrivateSubnets',
    });

    const privateSubnets = new DataAwsSubnets(this, `private_subnet_ids`, {
      provider: provider,
      filter: [
        {
          name: 'subnet-id',
          values: Fn.split(',', privateString.value),
        },
        { name: 'vpc-id', values: [this.vpc.id] },
      ],
    });

    this.privateSubnetIds = privateSubnets.ids;

    const publicString = new DataAwsSsmParameter(this, `public_subnets`, {
      provider: provider,
      name: '/Shared/PublicSubnets',
    });

    const publicSubnets = new DataAwsSubnets(this, `public_subnet_ids`, {
      provider: provider,
      filter: [
        {
          name: 'subnet-id',
          values: Fn.split(',', publicString.value),
        },
        { name: 'vpc-id', values: [this.vpc.id] },
      ],
    });

    this.publicSubnetIds = publicSubnets.ids;

    const identity = new DataAwsCallerIdentity(this, `current_identity`, {
      provider: provider,
    });
    this.accountId = identity.accountId;

    const region = new DataAwsRegion(this, 'current_region', {
      provider: provider,
    });
    this.region = region.name;

    this.secretsManagerSecretKey = new DataAwsKmsAlias(
      this,
      'secrets_manager_key',
      {
        provider: provider,
        name: 'alias/aws/secretsmanager',
      },
    );

    this.defaultSecurityGroups = new DataAwsSecurityGroups(
      this,
      'default_security_groups',
      {
        provider: provider,
        filter: [
          {
            name: 'group-name',
            values: ['default'],
          },
          {
            name: 'vpc-id',
            values: [this.vpc.id],
          },
        ],
      },
    );

    this.internalSecurityGroups = new DataAwsSecurityGroups(
      this,
      'internal_security_groups',
      {
        provider: provider,
        filter: [
          {
            name: 'group-name',
            values: ['pocket-vpc-internal'],
          },
          {
            name: 'vpc-id',
            values: [this.vpc.id],
          },
        ],
      },
    );
  }
}

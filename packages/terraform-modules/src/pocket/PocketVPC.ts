import {
  provider as awsProvider,
  dataAwsRegion,
  dataAwsVpc,
  dataAwsKmsAlias,
  dataAwsCallerIdentity,
  dataAwsSsmParameter,
  dataAwsSubnets,
  dataAwsSecurityGroups,
} from '@cdktf/provider-aws';
import { Fn } from 'cdktf';
import { Construct } from 'constructs';

export class PocketVPC extends Construct {
  public readonly vpc: dataAwsVpc.DataAwsVpc;

  public readonly region: string;
  public readonly accountId: string;
  public readonly privateSubnetIds: string[];
  public readonly publicSubnetIds: string[];
  public readonly secretsManagerSecretKey: dataAwsKmsAlias.DataAwsKmsAlias;
  public readonly defaultSecurityGroups: dataAwsSecurityGroups.DataAwsSecurityGroups;
  public readonly internalSecurityGroups: dataAwsSecurityGroups.DataAwsSecurityGroups;

  constructor(
    scope: Construct,
    name: string,
    provider?: awsProvider.AwsProvider,
  ) {
    super(scope, name);

    const vpcSSMParam = new dataAwsSsmParameter.DataAwsSsmParameter(
      this,
      `vpc_ssm_param`,
      {
        provider: provider,
        name: '/Shared/Vpc',
      },
    );

    this.vpc = new dataAwsVpc.DataAwsVpc(this, `vpc`, {
      provider: provider,
      filter: [
        {
          name: 'vpc-id',
          values: [vpcSSMParam.value],
        },
      ],
    });

    const privateString = new dataAwsSsmParameter.DataAwsSsmParameter(
      this,
      `private_subnets`,
      {
        provider: provider,
        name: '/Shared/PrivateSubnets',
      },
    );

    const privateSubnets = new dataAwsSubnets.DataAwsSubnets(
      this,
      `private_subnet_ids`,
      {
        provider: provider,
        filter: [
          {
            name: 'subnet-id',
            values: Fn.split(',', privateString.value),
          },
          { name: 'vpc-id', values: [this.vpc.id] },
        ],
      },
    );

    this.privateSubnetIds = privateSubnets.ids;

    const publicString = new dataAwsSsmParameter.DataAwsSsmParameter(
      this,
      `public_subnets`,
      {
        provider: provider,
        name: '/Shared/PublicSubnets',
      },
    );

    const publicSubnets = new dataAwsSubnets.DataAwsSubnets(
      this,
      `public_subnet_ids`,
      {
        provider: provider,
        filter: [
          {
            name: 'subnet-id',
            values: Fn.split(',', publicString.value),
          },
          { name: 'vpc-id', values: [this.vpc.id] },
        ],
      },
    );

    this.publicSubnetIds = publicSubnets.ids;

    const identity = new dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      `current_identity`,
      {
        provider: provider,
      },
    );
    this.accountId = identity.accountId;

    const region = new dataAwsRegion.DataAwsRegion(this, 'current_region', {
      provider: provider,
    });
    this.region = region.name;

    this.secretsManagerSecretKey = new dataAwsKmsAlias.DataAwsKmsAlias(
      this,
      'secrets_manager_key',
      {
        provider: provider,
        name: 'alias/aws/secretsmanager',
      },
    );

    this.defaultSecurityGroups =
      new dataAwsSecurityGroups.DataAwsSecurityGroups(
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

    this.internalSecurityGroups =
      new dataAwsSecurityGroups.DataAwsSecurityGroups(
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

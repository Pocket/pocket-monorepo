import {
  securityGroup,
  elasticacheSubnetGroup,
  dataAwsVpc,
} from '@cdktf/provider-aws';
import { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';

export enum ApplicationElasticacheEngine {
  MEMCACHED = 'memcached',
  REDIS = 'redis',
}

export interface ApplicationElasticacheClusterProps
  extends TerraformMetaArguments {
  prefix: string;
  vpcId: string;
  subnetIds: string[];
  allowedIngressSecurityGroupIds: string[];
  node?: {
    /**
     * This is the size as defined here:https://aws.amazon.com/elasticache/pricing
     * Theres a lot here to make an enum for this..
     */
    size?: string;
    /**
     * Number of nodes that should exist in the cluster
     */
    count?: number;
  };
  tags?: { [key: string]: string };
  overrideEngineVersion?: string; // overrides lookup by engine type, below
  overrideParameterGroupName?: string; // overides lookup by engine type, below
}

/**
 * Generates an elasticache cluster with the desired engine
 */
export abstract class ApplicationElasticacheCluster extends Construct {
  protected constructor(scope: Construct, name: string) {
    super(scope, name);
  }

  /**
   * Gets a VPC
   * @param scope
   * @param config
   * @protected
   */
  protected static getVpc(
    scope: Construct,
    config: ApplicationElasticacheClusterProps,
  ): dataAwsVpc.DataAwsVpc {
    return new dataAwsVpc.DataAwsVpc(scope, `vpc`, {
      filter: [
        {
          name: 'vpc-id',
          values: [config.vpcId],
        },
      ],
      provider: config.provider,
    });
  }

  /**
   * Returns the default port for the selected engine
   * @param engine
   * @private
   */
  protected static getPortForEngine(
    engine: ApplicationElasticacheEngine,
  ): number {
    switch (engine) {
      case ApplicationElasticacheEngine.MEMCACHED:
        return 11211;
      case ApplicationElasticacheEngine.REDIS:
        return 6379;
    }
  }

  /**
   * Returns the default parameter group for the selected engine
   * @param engine
   * @private
   */
  protected static getParameterGroupForEngine(
    engine: ApplicationElasticacheEngine,
  ): string {
    switch (engine) {
      case ApplicationElasticacheEngine.MEMCACHED:
        return 'default.memcached1.6';
      case ApplicationElasticacheEngine.REDIS:
        return 'default.redis7';
    }
  }

  /**
   * Returns the default engine version for the selected engine
   * @param engine
   * @private
   */
  protected static getEngineVersionForEngine(
    engine: ApplicationElasticacheEngine,
  ): string {
    switch (engine) {
      case ApplicationElasticacheEngine.MEMCACHED:
        return '1.6.6';
      case ApplicationElasticacheEngine.REDIS:
        return '7.0';
    }
  }

  /**
   * Create a subnet group for Elasticache
   * @param scope
   * @param config
   * @param appVpc
   * @param port
   * @protected
   */
  protected static createSubnet(
    scope: Construct,
    config: ApplicationElasticacheClusterProps,
  ): elasticacheSubnetGroup.ElasticacheSubnetGroup {
    return new elasticacheSubnetGroup.ElasticacheSubnetGroup(
      scope,
      'elasticache_subnet_group',
      {
        name: `${config.prefix.toLowerCase()}-ElasticacheSubnetGroup`,
        subnetIds: config.subnetIds,
        provider: config.provider,
        tags: config.tags,
      },
    );
  }

  /**
   * Create a security group for Elasticache
   * @param scope
   * @param config
   * @param appVpc
   * @param port
   * @protected
   */
  protected static createSecurityGroup(
    scope: Construct,
    config: ApplicationElasticacheClusterProps,
    appVpc: dataAwsVpc.DataAwsVpc,
    port: number,
  ): securityGroup.SecurityGroup {
    return new securityGroup.SecurityGroup(
      scope,
      'elasticache_security_group',
      {
        namePrefix: config.prefix,
        description: 'Managed by Terraform',
        vpcId: appVpc.id,
        ingress: [
          {
            fromPort: port,
            toPort: port,
            protocol: 'tcp',

            //If we have a ingress security group it takes precedence
            securityGroups: config.allowedIngressSecurityGroupIds
              ? config.allowedIngressSecurityGroupIds
              : undefined,

            //IF we do not have a ingress security group lets all the whole vpc access
            cidrBlocks: config.allowedIngressSecurityGroupIds
              ? undefined
              : [appVpc.cidrBlock],

            // the following are included due to a bug
            // https://github.com/hashicorp/terraform-cdk/issues/223
            description: undefined,
            ipv6CidrBlocks: undefined,
            prefixListIds: undefined,
          },
        ],
        tags: config.tags,
        provider: config.provider,
      },
    );
  }
}

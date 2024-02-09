import {
  ApplicationElasticacheCluster,
  ApplicationElasticacheClusterProps,
  ApplicationElasticacheEngine,
} from './ApplicationElasticacheCluster';
import { Construct } from 'constructs';
import { DataAwsVpc } from '@cdktf/provider-aws/lib/data-aws-vpc';
import { ElasticacheServerlessCache } from '@cdktf/provider-aws/lib/elasticache-serverless-cache';

export type ApplicationServerlessRedisProps = Omit<
  ApplicationElasticacheClusterProps,
  'node' | 'overrideEngineVersion'
>;

export class ApplicationServerlessRedis extends ApplicationElasticacheCluster {
  public elasticache: ElasticacheServerlessCache;

  constructor(
    scope: Construct,
    name: string,
    config: ApplicationServerlessRedisProps,
  ) {
    super(scope, name);

    const appVpc = ApplicationElasticacheCluster.getVpc(this, config);
    this.elasticache = ApplicationServerlessRedis.createElasticacheServerless(
      this,
      appVpc,
      config,
    );
  }

  /**
   * Creates the elasticache serverless cluster to be used
   * @param scope
   * @param appVpc
   * @param config
   * @private
   */
  private static createElasticacheServerless(
    scope: Construct,
    appVpc: DataAwsVpc,
    config: ApplicationServerlessRedisProps,
  ): ElasticacheServerlessCache {
    const engine = ApplicationElasticacheEngine.REDIS;
    const port = ApplicationElasticacheCluster.getPortForEngine(engine);

    const securityGroup = ApplicationServerlessRedis.createSecurityGroup(
      scope,
      config,
      appVpc,
      port,
    );

    let subnetIds = config.subnetIds;
    if (subnetIds.length > 3) {
      console.warn(
        'More then 3 subnetIds were passed to elasticache and it only supports up to 3 will only use the first 3.',
      );
      subnetIds = config.subnetIds.slice(0, 3);
    }

    if (subnetIds.length < 2) {
      throw new Error('Elasticache serverless requires at least 2 subnets');
    }

    return new ElasticacheServerlessCache(scope, 'elasticache_serverless', {
      engine: engine,
      name: config.prefix,
      description: `Redis for ${config.prefix}`,
      provider: config.provider,
      securityGroupIds: [securityGroup.id],
      subnetIds: subnetIds,
      tags: config.tags,
    });
  }
}

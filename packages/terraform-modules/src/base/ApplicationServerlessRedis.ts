import {
  ApplicationElasticacheCluster,
  ApplicationElasticacheClusterProps,
  ApplicationElasticacheEngine,
} from './ApplicationElasticacheCluster';
import { Construct } from 'constructs';
import { Fn } from 'cdktf';
import { DataAwsVpc } from '@cdktf/provider-aws/lib/data-aws-vpc';
import {
  ElasticacheServerlessCache,
  ElasticacheServerlessCacheConfig,
} from '@cdktf/provider-aws/lib/elasticache-serverless-cache';

export type ApplicationServerlessRedisProps = Omit<
  ApplicationElasticacheClusterProps,
  'node' | 'overrideEngineVersion'
> &
  Pick<ElasticacheServerlessCacheConfig, 'cacheUsageLimits'>;

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

    return new ElasticacheServerlessCache(scope, 'elasticache_serverless', {
      engine: engine,
      name: config.prefix.toLowerCase(),
      description: `Redis for ${config.prefix}`,
      provider: config.provider,
      securityGroupIds: [securityGroup.id],
      cacheUsageLimits: config.cacheUsageLimits,
      // SubnetIds comes usually from PocketVPC, it is declared as a string[] but in reality its a special terraform value determined at runtime.
      // So we need to use a terraform function to splice the array, because Serverless redis only lets us use 2-3 subnets.
      // In the future we should see if there is a way to fix the CDKTF type in terrraform modules so that developers are not tricked by string[] on subnetIds on pocketvpc.
      subnetIds: Fn.slice(config.subnetIds, 0, 3),
      tags: config.tags,
    });
  }
}

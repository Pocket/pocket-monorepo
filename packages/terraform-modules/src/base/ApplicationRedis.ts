import {
  ApplicationElasticacheCluster,
  ApplicationElasticacheClusterProps,
  ApplicationElasticacheEngine,
} from './ApplicationElasticacheCluster.js';
import { Construct } from 'constructs';
import { dataAwsVpc, elasticacheReplicationGroup } from '@cdktf/provider-aws';

const DEFAULT_CONFIG = {
  node: {
    size: 'cache.t3.micro',
    count: 2,
  },
};

export class ApplicationRedis extends ApplicationElasticacheCluster {
  public elasticacheReplicationGroup: elasticacheReplicationGroup.ElasticacheReplicationGroup;

  constructor(
    scope: Construct,
    name: string,
    config: ApplicationElasticacheClusterProps,
  ) {
    super(scope, name);

    // use default config, but update any user-provided values
    config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    const appVpc = ApplicationElasticacheCluster.getVpc(this, config);

    this.elasticacheReplicationGroup =
      ApplicationRedis.createElasticacheReplicationCluster(
        this,
        appVpc,
        config,
      );
  }

  /**
   * Creates the elasticache cluster to be used
   * @param scope
   * @param appVpc
   * @param config
   * @private
   */
  private static createElasticacheReplicationCluster(
    scope: Construct,
    appVpc: dataAwsVpc.DataAwsVpc,
    config: ApplicationElasticacheClusterProps,
  ): elasticacheReplicationGroup.ElasticacheReplicationGroup {
    const engine = ApplicationElasticacheEngine.REDIS;
    const port = ApplicationElasticacheCluster.getPortForEngine(engine);

    const securityGroup = ApplicationRedis.createSecurityGroup(
      scope,
      config,
      appVpc,
      port,
    );

    const subnetGroup = ApplicationRedis.createSubnet(scope, config);

    return new elasticacheReplicationGroup.ElasticacheReplicationGroup(
      scope,
      'elasticache_replication_group',
      {
        replicationGroupId: `${config.prefix.toLowerCase()}`,
        description: `${config.prefix.toLowerCase()} | Managed by terraform`,
        nodeType: config.node.size,
        port: port,
        engineVersion:
          config.overrideEngineVersion === null ||
          config.overrideEngineVersion === undefined
            ? ApplicationRedis.getEngineVersionForEngine(engine)
            : config.overrideEngineVersion,
        parameterGroupName:
          config.overrideParameterGroupName === null ||
          config.overrideParameterGroupName === undefined
            ? ApplicationRedis.getParameterGroupForEngine(engine)
            : config.overrideParameterGroupName,
        automaticFailoverEnabled: true,
        subnetGroupName: subnetGroup.name,
        securityGroupIds: [securityGroup.id],
        tags: config.tags,
        applyImmediately: true,
        dependsOn: [subnetGroup, securityGroup],
        numCacheClusters: config.node.count ?? 2,
        multiAzEnabled: true,
        provider: config.provider,
      },
    );
  }
}

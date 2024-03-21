import { ecsCluster } from '@cdktf/provider-aws';
import { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';

export interface ApplicationECSClusterProps extends TerraformMetaArguments {
  prefix: string;
  tags?: { [key: string]: string };
}

/**
 * Generates an Application Certificate given a domain name and zoneId
 */
export class ApplicationECSCluster extends Construct {
  public readonly cluster: ecsCluster.EcsCluster;

  constructor(
    scope: Construct,
    name: string,
    config: ApplicationECSClusterProps,
  ) {
    super(scope, name);

    this.cluster = new ecsCluster.EcsCluster(this, `ecs_cluster`, {
      tags: config.tags,
      name: config.prefix,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      provider: config.provider,
    });
  }
}

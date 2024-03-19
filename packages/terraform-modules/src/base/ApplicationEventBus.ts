import { cloudwatchEventBus } from '@cdktf/provider-aws';
import { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';

export interface ApplicationEventBusProps extends TerraformMetaArguments {
  name: string;
  tags?: { [key: string]: string };
}

export class ApplicationEventBus extends Construct {
  public readonly bus: cloudwatchEventBus.CloudwatchEventBus;

  constructor(
    scope: Construct,
    name: string,
    private config: ApplicationEventBusProps,
  ) {
    super(scope, name);

    this.bus = this.createCloudWatchEventBus();
  }

  private createCloudWatchEventBus(): cloudwatchEventBus.CloudwatchEventBus {
    return new cloudwatchEventBus.CloudwatchEventBus(
      this,
      `event-bus-${this.config.name}`,
      {
        name: this.config.name,
        tags: this.config.tags,
        provider: this.config.provider,
      },
    );
  }
}

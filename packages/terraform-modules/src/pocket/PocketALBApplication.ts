import {
  provider as awsProvider,
  albListener,
  cloudfrontDistribution,
  cloudwatchDashboard,
  cloudwatchMetricAlarm,
  efsFileSystem,
  route53Record,
  wafv2WebAclAssociation,
} from '@cdktf/provider-aws';
import { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';
import {
  ApplicationAutoscaling,
  ApplicationBaseDNS,
  ApplicationCertificate,
  ApplicationECSCluster,
  ApplicationECSContainerDefinitionProps,
  ApplicationECSIAMProps,
  ApplicationECSService,
  ApplicationECSServiceProps,
  ApplicationLoadBalancer,
} from '../index.js';
import { PocketVPC } from './PocketVPC.js';

export interface PocketALBApplicationAlarmProps extends TerraformMetaArguments {
  threshold?: number;
  period?: number;
  evaluationPeriods?: number;
  datapointsToAlarm?: number;
  actions?: string[];
  alarmDescription?: string;
}

export interface PocketALBApplicationProps extends TerraformMetaArguments {
  /**
   * This is the prefix for the names of all the resources
   * created by this construct.
   */
  prefix: string;
  /**
   * Optional config to define the region for the service.
   * This is used to define the cloudwatch dashboards
   * as well as the region of the cloudwatch logs
   */
  region?: string;
  /**
   * VPC configuration for all resource that require it within
   * this construct. A default Pocket VPC will be used if not
   * provided.
   */
  vpcConfig?: {
    vpcId: string;
    privateSubnetIds: string[];
    publicSubnetIds: string[];
  };
  /**
   * Prefix for the name of the application load balancer created
   * as part of this construct. Due to an arbitrary AWS character
   * limit, this has to be kept at 6 characters or less.
   */
  alb6CharacterPrefix: string;
  /**
   * Optional config to create an internal or public facing
   * ALB. By default, this is set to false.
   */
  internal?: boolean;
  /**
   * The domain the ECS service created by this construct will
   * be available at.
   */
  domain: string;
  /**
   * Optional config to create a CDN. By default, no CDN is created.
   */
  cdn?: boolean;

  /**
   * Optional config to dump alb logs to a bucket.

   */
  accessLogs?: {
    /**
     * Existing bucket to dump alb logs too, one of existingBucket or bucket must be chosen.
     * If using this options, this module assumes that the bucket already exists in your AWS account and has IAM setup according
     * to https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html#attach-bucket-policy which is account wide.
     */
    existingBucket?: string;

    /**
     * Bucket to dump alb logs too, one of existingBucket or bucket must be chosen.
     */
    bucket?: string;

    /**
     * Optional bucket path prefix. If not defined will use server-logs/{service-name}/internal-alb/AWSLogs/{awsaccountid}/elasticloadbalancing/
     * Be sure to include a trailing /
     */
    prefix?: string;
  };

  /**
   * Option for how the service created by this construct should be
   * deployed.
   */
  codeDeploy: {
    /**
     * Option to create a CodePipeline resource. Default is false.
     */
    useCodePipeline?: boolean;
    /**
     * Option to create a CodeDeploy application.
     */
    useCodeDeploy: boolean;
    /**
     * Option to deploy a new version using terraform, instead of externally
     */
    useTerraformBasedCodeDeploy?: boolean;
    /**
     * Option to generate an app spec file with the task def arn
     */
    generateAppSpec?: boolean;
    /**
     * Optional SNS topic for CodeDeploy notifications.
     */
    snsNotificationTopicArn?: string;
    /**
     * Optional wait time after replacement task completion. Default is 5 minutes.
     */
    successTerminationWaitTimeInMinutes?: number;

    notifications?: {
      /**
       * Option to send CodeDeploy notifications on Started event, defaults to true.
       */
      notifyOnStarted?: boolean;
      /**
       * Option to send CodeDeploy notifications on Succeeded event, defaults to true.
       */
      notifyOnSucceeded?: boolean;
      /**
       * Option to send CodeDeploy notifications on Failed event, defaults to true.
       */
      notifyOnFailed?: boolean;
    };
  };
  /**
   * Tags for all resources created by this construct.
   */
  tags?: { [key: string]: string };
  /**
   * Container definitions for the ECS task.
   */
  containerConfigs: ApplicationECSContainerDefinitionProps[];
  /**
   * Description of the container that is exposed to the ALB.
   */
  exposedContainer: {
    port: number;
    name: string;
    healthCheckPath: string;
  };
  /**
   * ECS task size configuration.
   */
  taskSize?: {
    cpu: number;
    memory: number;
  };
  /**
   * IAM config for the ECS Service and Tasks.
   */
  ecsIamConfig: ApplicationECSIAMProps;
  /**
   * Options for configuring the autoscaling policy for
   * the ECS service created by this construct.
   */
  autoscalingConfig?: {
    targetMinCapacity?: number;
    targetMaxCapacity?: number;
    stepScaleInAdjustment?: number;
    stepScaleOutAdjustment?: number;
    scaleInThreshold?: number;
    scaleOutThreshold?: number;
  };
  /**
   * Option for defining Cloudwatch alarms
   */
  alarms?: {
    http5xxErrorPercentage?: PocketALBApplicationAlarmProps;
    httpLatency?: PocketALBApplicationAlarmProps;
    customAlarms?: cloudwatchMetricAlarm.CloudwatchMetricAlarmConfig[];
  };
  efsConfig?: {
    creationToken?: string;
    throughputMode?: string;
    volumeName: string;
  };
  wafConfig?: {
    aclArn: string;
  };
}

interface CreateALBReturn {
  alb: ApplicationLoadBalancer;
  albRecord: route53Record.Route53Record;
  albCertificate: ApplicationCertificate;
}

// can export if we need to use outside of this module
const DEFAULT_AUTOSCALING_CONFIG = {
  scaleOutThreshold: 45,
  scaleInThreshold: 30,
  targetMinCapacity: 1,
  targetMaxCapacity: 2,
  stepScaleInAdjustment: -1,
  stepScaleOutAdjustment: 2,
};

export class PocketALBApplication extends Construct {
  public readonly alb: ApplicationLoadBalancer;
  public readonly ecsService: ApplicationECSService;
  public readonly baseDNS: ApplicationBaseDNS;
  public readonly listeners: albListener.AlbListener[];
  private readonly config: PocketALBApplicationProps;
  private readonly pocketVPC: PocketALBApplicationProps['vpcConfig'];
  private readonly efs: efsFileSystem.EfsFileSystem;

  constructor(
    scope: Construct,
    name: string,
    config: PocketALBApplicationProps,
  ) {
    super(scope, name);

    this.listeners = [];

    this.config = PocketALBApplication.validateConfig(config);

    // use default auto-scaling config, but update any user-provided values
    this.config.autoscalingConfig = {
      ...DEFAULT_AUTOSCALING_CONFIG,
      ...config.autoscalingConfig,
    };

    this.pocketVPC = this.getVpcConfig(config);

    //Set up the Base DNS stack for our application which includes a hosted SubZone
    this.baseDNS = new ApplicationBaseDNS(this, `base_dns`, {
      domain: config.domain,
      tags: config.tags,
    });

    const { alb, albRecord, albCertificate } = this.createALB();
    this.alb = alb;

    if (config.cdn) {
      this.createCDN(albRecord);
    }

    if (config.wafConfig) {
      this.createWAF(alb, config.wafConfig.aclArn);
    }

    if (config.efsConfig) {
      this.efs = this.createEfs(config);
    }

    const ecsService = this.createECSService(alb, albCertificate);
    this.ecsService = ecsService.ecs;

    this.createCloudwatchDashboard(
      alb.alb.arnSuffix,
      ecsService.ecs.service.name,
      ecsService.cluster.cluster.name,
    );

    this.createCloudwatchAlarms();
  }

  /**
   * Fall back to standard Pocket config if a custom VPC configuration has not been supplied.
   *
   * @param config
   * @private
   */
  private getVpcConfig(
    config: PocketALBApplicationProps,
  ): PocketALBApplicationProps['vpcConfig'] {
    if (config.vpcConfig !== undefined) {
      return {
        vpcId: config.vpcConfig.vpcId,
        privateSubnetIds: config.vpcConfig.privateSubnetIds,
        publicSubnetIds: config.vpcConfig.publicSubnetIds,
      };
    } else {
      const pocketVpc = new PocketVPC(
        this,
        `pocket_vpc`,
        config.provider as awsProvider.AwsProvider,
      );
      return {
        vpcId: pocketVpc.vpc.id,
        privateSubnetIds: pocketVpc.privateSubnetIds,
        publicSubnetIds: pocketVpc.publicSubnetIds,
      };
    }
  }

  /**
   * Validate the Configuration
   *
   * @param config
   * @private
   */
  private static validateConfig(
    config: PocketALBApplicationProps,
  ): PocketALBApplicationProps {
    config = PocketALBApplication.validateCachedALB(config);

    PocketALBApplication.validateAlarmsConfig(config.alarms);

    return config;
  }

  private static validateAlarmsConfig(
    config: PocketALBApplicationProps['alarms'],
  ): void {
    if (!config) return;

    const alarmsToValidate = {
      http5xxErrorPercentage: 'HTTP 5xx Error',
      httpLatency: 'HTTP Latency',
      httpRequestCount: 'HTTP Request Count',
    };

    const errorMessage =
      'DatapointsToAlarm must be less than or equal to EvaluationPeriods';

    Object.keys(alarmsToValidate).forEach((key) => {
      if (
        config[key]?.datapointsToAlarm > (config[key]?.evaluationPeriods ?? 1)
      ) {
        throw new Error(`${alarmsToValidate[key]} Alarm: ${errorMessage}`);
      }
    });

    config.customAlarms?.forEach(
      (alarm: cloudwatchMetricAlarm.CloudwatchMetricAlarmConfig) => {
        if (alarm.datapointsToAlarm > alarm.evaluationPeriods) {
          throw new Error(`${alarm.alarmName}: ${errorMessage}`);
        }
      },
    );
  }

  private createEfs(
    config: PocketALBApplicationProps,
  ): efsFileSystem.EfsFileSystem {
    return new efsFileSystem.EfsFileSystem(this, 'efsFs', {
      creationToken: config.efsConfig.creationToken,
      encrypted: true,
      tags: config.tags,
      provider: config.provider,
    });
  }

  private static validateCachedALB(
    config: PocketALBApplicationProps,
  ): PocketALBApplicationProps {
    if (config.cdn === undefined) {
      //Set a default of cached to false
      config.cdn = false;
    }

    if (config.internal === undefined) {
      //Set a default of internal to false
      config.internal = false;
    }

    if (config.internal && config.cdn) {
      throw Error('You can not have a cached ALB and have it be internal.');
    }

    return config;
  }

  private createWAF(alb: ApplicationLoadBalancer, webAclArn: string) {
    new wafv2WebAclAssociation.Wafv2WebAclAssociation(
      this,
      'application_waf_association',
      {
        webAclArn: webAclArn,
        resourceArn: alb.alb.arn,
      },
    );
  }

  /**
   * Creates the ALB stack and certificates
   * @private
   */
  private createALB(): CreateALBReturn {
    //Create our application Load Balancer
    const alb = new ApplicationLoadBalancer(this, `application_load_balancer`, {
      vpcId: this.pocketVPC.vpcId,
      prefix: this.config.prefix,
      alb6CharacterPrefix: this.config.alb6CharacterPrefix,
      subnetIds: this.config.internal
        ? this.pocketVPC.privateSubnetIds
        : this.pocketVPC.publicSubnetIds,
      internal: this.config.internal,
      tags: this.config.tags,
      accessLogs: this.config.accessLogs,
      provider: this.config.provider,
    });

    //When the app uses a CDN we set the ALB to be direct.app-domain
    //Then the CDN is our main app.
    const albDomainName = this.config.cdn
      ? `direct.${this.config.domain}`
      : this.config.domain;

    //Sets up the record for the ALB.
    const albRecord = new route53Record.Route53Record(this, `alb_record`, {
      name: albDomainName,
      type: 'A',
      zoneId: this.baseDNS.zoneId,
      weightedRoutingPolicy: {
        weight: 1,
      },
      alias: {
        name: alb.alb.dnsName,
        zoneId: alb.alb.zoneId,
        evaluateTargetHealth: true,
      },
      lifecycle: {
        ignoreChanges: ['weighted_routing_policy[0].weight'],
      },
      setIdentifier: '1',
      provider: this.config.provider,
    });

    //Creates the Certificate for the ALB
    const albCertificate = new ApplicationCertificate(this, `alb_certificate`, {
      zoneId: this.baseDNS.zoneId,
      domain: albDomainName,
      tags: this.config.tags,
      provider: this.config.provider,
    });

    return {
      alb,
      albRecord,
      albCertificate,
    };
  }

  /**
   * Create the CDN if the ALB is backed by one.
   *
   * @param albRecord
   * @private
   */
  private createCDN(albRecord: route53Record.Route53Record): void {
    //Create the certificate for the CDN
    const cdnCertificate = new ApplicationCertificate(this, `cdn_certificate`, {
      zoneId: this.baseDNS.zoneId,
      domain: this.config.domain,
      tags: this.config.tags,
      provider: this.config.provider,
    });

    //Create the CDN
    const cdn = new cloudfrontDistribution.CloudfrontDistribution(
      this,
      `cloudfront_distribution`,
      {
        comment: `CDN for direct.${this.config.domain}`,
        enabled: true,
        aliases: [this.config.domain],
        priceClass: 'PriceClass_200',
        tags: this.config.tags,
        origin: [
          {
            domainName: albRecord.fqdn,
            originId: 'Alb',
            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,
              originProtocolPolicy: 'https-only',
              originSslProtocols: ['TLSv1.1', 'TLSv1.2'],
            },
          },
        ],
        defaultCacheBehavior: {
          targetOriginId: 'Alb',
          viewerProtocolPolicy: 'redirect-to-https',
          compress: true,
          allowedMethods: [
            'GET',
            'HEAD',
            'OPTIONS',
            'PUT',
            'POST',
            'PATCH',
            'DELETE',
          ],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          forwardedValues: {
            queryString: true,
            headers: ['Accept', 'Origin', 'Authorization'], //This is important for apollo because it serves different responses based on this
            cookies: {
              forward: 'none',
            },
          },
          //These are hacks to enable Use Origin Cache Header
          //https://github.com/hashicorp/terraform-provider-aws/issues/19382
          defaultTtl: 0, //This breaks from the hack, because the default was 0 before. As long as clients specify a cache header this is overridden.
          minTtl: 0,
          maxTtl: 31536000, // 1 year
        },
        viewerCertificate: {
          acmCertificateArn: cdnCertificate.arn,
          sslSupportMethod: 'sni-only',
          minimumProtocolVersion: 'TLSv1.1_2016',
        },
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        provider: this.config.provider,
      },
    );

    // These are hacks to enable Use Origin Cache Header
    // https://github.com/hashicorp/terraform-provider-aws/issues/19382
    cdn.addOverride('default_cache_behavior.default_ttl', 0);
    cdn.addOverride('default_cache_behavior.min_ttl', 0);

    //When cached the CDN must point to the Load Balancer
    new route53Record.Route53Record(this, `cdn_record`, {
      name: this.config.domain,
      type: 'A',
      zoneId: this.baseDNS.zoneId,
      weightedRoutingPolicy: {
        weight: 1,
      },
      alias: {
        name: cdn.domainName,
        zoneId: cdn.hostedZoneId,
        evaluateTargetHealth: true,
      },
      lifecycle: {
        ignoreChanges: ['weighted_routing_policy[0].weight'],
      },
      setIdentifier: '2',
      provider: this.config.provider,
    });
  }

  /**
   * Create the ECS service and attach it to the ALB
   * @param alb
   * @param albCertificate
   * @private
   */
  private createECSService(
    alb: ApplicationLoadBalancer,
    albCertificate: ApplicationCertificate,
  ): { ecs: ApplicationECSService; cluster: ApplicationECSCluster } {
    const ecsCluster = new ApplicationECSCluster(this, 'ecs_cluster', {
      prefix: this.config.prefix,
      tags: this.config.tags,
    });

    const httpListener = new albListener.AlbListener(this, 'listener_http', {
      loadBalancerArn: alb.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'redirect',
          redirect: { port: '443', protocol: 'HTTPS', statusCode: 'HTTP_301' },
        },
      ],
      provider: this.config.provider,
      tags: this.config.tags,
    });

    const httpsListener = new albListener.AlbListener(this, 'listener_https', {
      loadBalancerArn: alb.alb.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-TLS-1-1-2017-01',
      defaultAction: [
        {
          type: 'fixed-response',
          fixedResponse: {
            // To keep things dry we use a default status code here and append a rule for our target group.
            // This is because our ECSService is responsible for creating our target group because CodeDeploy requires
            // 2 target groups and knowing the names of them both
            contentType: 'text/plain',
            statusCode: '503',
            messageBody: '',
          },
        },
      ],
      certificateArn: albCertificate.arn,
      provider: this.config.provider,
      tags: this.config.tags,
    });

    // We want to be able to make resource changes on the ALB's listeners, so we expose them
    this.listeners.push(httpListener, httpsListener);

    let ecsConfig: ApplicationECSServiceProps = {
      prefix: this.config.prefix,
      region: this.config.region,
      shortName: this.config.alb6CharacterPrefix,
      ecsClusterArn: ecsCluster.cluster.arn,
      ecsClusterName: ecsCluster.cluster.name,
      useCodeDeploy: this.config.codeDeploy.useCodeDeploy,
      codeDeployNotifications: this.config.codeDeploy.notifications,
      useCodePipeline: this.config.codeDeploy.useCodePipeline,
      useTerraformBasedCodeDeploy:
        this.config.codeDeploy.useTerraformBasedCodeDeploy,
      generateAppSpec: this.config.codeDeploy.generateAppSpec,
      successTerminationWaitTimeInMinutes:
        this.config.codeDeploy.successTerminationWaitTimeInMinutes,
      codeDeploySnsNotificationTopicArn:
        this.config.codeDeploy.snsNotificationTopicArn,
      albConfig: {
        containerPort: this.config.exposedContainer.port,
        containerName: this.config.exposedContainer.name,
        healthCheckPath: this.config.exposedContainer.healthCheckPath,
        listenerArn: httpsListener.arn,
        albSecurityGroupId: alb.securityGroup.id,
      },
      vpcId: this.pocketVPC.vpcId,
      containerConfigs: this.config.containerConfigs,
      privateSubnetIds: this.pocketVPC.privateSubnetIds,
      ecsIamConfig: this.config.ecsIamConfig,
      provider: this.config.provider,
      tags: this.config.tags,
    };

    if (this.config.taskSize) {
      ecsConfig = {
        ...this.config.taskSize,
        ...ecsConfig,
      };
    }

    if (this.config.efsConfig) {
      ecsConfig.efsConfig = {
        efs: { id: this.efs.id, arn: this.efs.arn },
        volumeName: this.config.efsConfig.volumeName,
      };
    }

    const ecsService = new ApplicationECSService(
      this,
      'ecs_service',
      ecsConfig,
    );

    new ApplicationAutoscaling(this, 'autoscaling', {
      prefix: this.config.prefix,
      targetMinCapacity: this.config.autoscalingConfig.targetMinCapacity,
      targetMaxCapacity: this.config.autoscalingConfig.targetMaxCapacity,
      ecsClusterName: ecsCluster.cluster.name,
      ecsServiceName: ecsService.service.name,
      scalableDimension: 'ecs:service:DesiredCount',
      stepScaleInAdjustment:
        this.config.autoscalingConfig.stepScaleInAdjustment,
      stepScaleOutAdjustment:
        this.config.autoscalingConfig.stepScaleOutAdjustment,
      scaleInThreshold: this.config.autoscalingConfig.scaleInThreshold,
      scaleOutThreshold: this.config.autoscalingConfig.scaleOutThreshold,
      provider: this.config.provider,
      tags: this.config.tags,
    });

    return {
      ecs: ecsService,
      cluster: ecsCluster,
    };
  }

  /**
   * Create a Cloudwatch dashboard JSON object
   *
   * @param albArnSuffix
   * @param ecsServiceName
   * @param ecsServiceClusterName
   */
  private createCloudwatchDashboard(
    albArnSuffix: string,
    ecsServiceName: string,
    ecsServiceClusterName: string,
  ): cloudwatchDashboard.CloudwatchDashboard {
    // set some defaults, then ignore all future changes / manual edits & additions.
    const dashboardJSON = {
      widgets: [
        {
          type: 'metric',
          x: 0,
          y: 0,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              [
                'AWS/ApplicationELB',
                'HTTPCode_Target_4XX_Count',
                'LoadBalancer',
                albArnSuffix,
                {
                  yAxis: 'left',
                  color: '#ff7f0e',
                },
              ],
              [
                '.',
                'RequestCount',
                '.',
                '.',
                {
                  yAxis: 'right',
                  color: '#1f77b4',
                },
              ],
              [
                '.',
                'HTTPCode_Target_5XX_Count',
                '.',
                '.',
                {
                  color: '#d62728',
                },
              ],
              [
                '.',
                'HTTPCode_Target_2XX_Count',
                '.',
                '.',
                {
                  yAxis: 'right',
                  color: '#2ca02c',
                },
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: this.config.region ?? 'us-east-1',
            period: 60,
            stat: 'Sum',
            title: 'Target Requests',
          },
        },
        {
          type: 'metric',
          x: 12,
          y: 0,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              [
                'AWS/ApplicationELB',
                'HTTPCode_ELB_4XX_Count',
                'LoadBalancer',
                albArnSuffix,
                {
                  yAxis: 'left',
                  color: '#ff7f0e',
                },
              ],
              [
                '.',
                'RequestCount',
                '.',
                '.',
                {
                  yAxis: 'right',
                  color: '#1f77b4',
                },
              ],
              [
                '.',
                'HTTPCode_ELB_5XX_Count',
                '.',
                '.',
                {
                  color: '#d62728',
                },
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: this.config.region ?? 'us-east-1',
            period: 60,
            stat: 'Sum',
            title: 'ALB Requests',
          },
        },
        {
          type: 'metric',
          x: 12,
          y: 6,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              [
                'AWS/ApplicationELB',
                'TargetResponseTime',
                'LoadBalancer',
                albArnSuffix,
                {
                  label: 'Average',
                  color: '#aec7e8',
                },
              ],
              [
                '...',
                {
                  stat: 'p95',
                  label: 'p95',
                  color: '#ffbb78',
                },
              ],
              [
                '...',
                {
                  stat: 'p99',
                  label: 'p99',
                  color: '#98df8a',
                },
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: this.config.region ?? 'us-east-1',
            stat: 'Average',
            period: 60,
          },
        },
        {
          type: 'metric',
          x: 0,
          y: 6,
          width: 12,
          height: 6,
          properties: {
            metrics: [
              [
                'ECS/ContainerInsights',
                'RunningTaskCount',
                'ServiceName',
                ecsServiceName,
                'ClusterName',
                ecsServiceClusterName,
                {
                  yAxis: 'right',
                  color: '#c49c94',
                },
              ],
              [
                'AWS/ECS',
                'CPUUtilization',
                '.',
                '.',
                '.',
                '.',
                {
                  color: '#f7b6d2',
                },
              ],
              [
                '.',
                'MemoryUtilization',
                '.',
                '.',
                '.',
                '.',
                {
                  color: '#c7c7c7',
                },
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: this.config.region ?? 'us-east-1',
            stat: 'Average',
            period: 60,
            annotations: {
              horizontal: [
                {
                  color: '#e377c2',
                  label: 'CPU scale out',
                  value: this.config.autoscalingConfig.scaleOutThreshold,
                },
                {
                  color: '#c5b0d5',
                  label: 'CPU scale in',
                  value: this.config.autoscalingConfig.scaleInThreshold,
                },
              ],
            },
            title: 'Service Load',
          },
        },
      ],
    };

    return new cloudwatchDashboard.CloudwatchDashboard(
      this,
      'cloudwatch-dashboard',
      {
        dashboardName: `${this.config.prefix}`,
        dashboardBody: JSON.stringify(dashboardJSON),
        lifecycle: {
          ignoreChanges: ['dashboard_body'],
        },
        provider: this.config.provider,
      },
    );
  }

  private createCloudwatchAlarms(): void {
    const alarmsConfig = this.config.alarms;
    const evaluationPeriods = {
      http5xxErrorPercentage:
        alarmsConfig?.http5xxErrorPercentage?.evaluationPeriods ?? 5,
      httpLatency: alarmsConfig?.httpLatency?.evaluationPeriods ?? 1,
    };
    const http5xxAlarm: cloudwatchMetricAlarm.CloudwatchMetricAlarmConfig = {
      alarmName: 'Alarm-HTTPTarget5xxErrorRate',
      metricQuery: [
        {
          id: 'requests',
          metric: {
            metricName: 'RequestCount',
            namespace: 'AWS/ApplicationELB',
            period: alarmsConfig?.http5xxErrorPercentage?.period ?? 60,
            stat: 'Sum',
            unit: 'Count',
            dimensions: { LoadBalancer: this.alb.alb.arnSuffix },
          },
        },
        {
          id: 'errors',
          metric: {
            metricName: 'HTTPCode_Target_5XX_Count',
            namespace: 'AWS/ApplicationELB',
            period: alarmsConfig?.http5xxErrorPercentage?.period ?? 60,
            stat: 'Sum',
            unit: 'Count',
            dimensions: { LoadBalancer: this.alb.alb.arnSuffix },
          },
        },
        {
          id: 'expression',
          expression: 'errors/requests*100',
          label: 'HTTP 5xx Error Rate',
          returnData: true,
        },
      ],
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      evaluationPeriods: evaluationPeriods.http5xxErrorPercentage,
      datapointsToAlarm:
        alarmsConfig?.http5xxErrorPercentage?.datapointsToAlarm ??
        evaluationPeriods.http5xxErrorPercentage,
      threshold: alarmsConfig?.http5xxErrorPercentage?.threshold ?? 5,
      insufficientDataActions: [],
      alarmActions: alarmsConfig?.http5xxErrorPercentage?.actions ?? [],
      okActions: alarmsConfig?.http5xxErrorPercentage?.actions ?? [],
      tags: this.config.tags,
      alarmDescription:
        alarmsConfig?.http5xxErrorPercentage?.alarmDescription ??
        'Percentage of 5xx responses exceeds threshold',
      provider: this.config.provider,
    };
    const latencyAlarm: cloudwatchMetricAlarm.CloudwatchMetricAlarmConfig = {
      alarmName: 'Alarm-HTTPResponseTime',
      namespace: 'AWS/ApplicationELB',
      metricName: 'TargetResponseTime',
      dimensions: { LoadBalancer: this.alb.alb.arnSuffix },
      period: alarmsConfig?.httpLatency?.period ?? 300,
      evaluationPeriods: evaluationPeriods.httpLatency,
      datapointsToAlarm:
        alarmsConfig?.httpLatency?.datapointsToAlarm ??
        evaluationPeriods.httpLatency,
      statistic: 'Average',
      comparisonOperator: 'GreaterThanThreshold',
      threshold: alarmsConfig?.httpLatency?.threshold ?? 300,
      alarmDescription:
        alarmsConfig?.httpLatency?.alarmDescription ??
        'Average HTTP response time exceeds threshold',
      insufficientDataActions: [],
      alarmActions: alarmsConfig?.httpLatency?.actions ?? [],
      okActions: alarmsConfig?.httpLatency?.actions ?? [],
      provider: this.config.provider,
      tags: this.config.tags,
    };

    const defaultAlarms: cloudwatchMetricAlarm.CloudwatchMetricAlarmConfig[] =
      [];

    if (alarmsConfig?.http5xxErrorPercentage) defaultAlarms.push(http5xxAlarm);

    if (alarmsConfig?.httpLatency) defaultAlarms.push(latencyAlarm);

    if (alarmsConfig?.customAlarms) {
      defaultAlarms.push(...alarmsConfig.customAlarms);
    }

    if (defaultAlarms.length) this.createAlarms(defaultAlarms);
  }

  private createAlarms(
    alarms: cloudwatchMetricAlarm.CloudwatchMetricAlarmConfig[],
  ): void {
    alarms.forEach((alarmConfig) => {
      new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        alarmConfig.alarmName.toLowerCase(),
        {
          ...alarmConfig,
          alarmName: `${this.config.prefix}-${alarmConfig.alarmName}`,
        },
      );
    });
  }
}

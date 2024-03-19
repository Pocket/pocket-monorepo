import { Resource } from '@cdktf/provider-null/lib/resource';
import { Sleep } from '@cdktf/provider-time/lib/sleep';
import { Construct } from 'constructs';
import { ApplicationECR, ECRProps } from './ApplicationECR.js';
import {
  ApplicationECSIAM,
  ApplicationECSIAMProps,
} from './ApplicationECSIAM.js';
import {
  ApplicationECSContainerDefinitionProps,
  buildDefinitionJSON,
} from './ApplicationECSContainerDefinition.js';
import { ApplicationTargetGroup } from './ApplicationTargetGroup.js';
import { ApplicationECSAlbCodeDeploy } from './ApplicationECSAlbCodeDeploy.js';
import {
  TerraformResource,
  TerraformIterator,
  TerraformMetaArguments,
  Fn,
} from 'cdktf';
import { truncateString } from '../utilities.js';
import { File } from '@cdktf/provider-local/lib/file';
import {
  ecrRepository,
  albListenerRule,
  cloudwatchLogGroup,
  ecsService,
  ecsTaskDefinition,
  efsFileSystemPolicy,
  efsMountTarget,
  securityGroup,
} from '@cdktf/provider-aws';

const defaultRegion = 'us-east-1';

export interface ApplicationECSServiceProps extends TerraformMetaArguments {
  prefix: string;
  region?: string;
  shortName: string;
  tags?: { [key: string]: string };
  ecsClusterArn: string;
  ecsClusterName: string;
  vpcId: string;
  albConfig?: {
    containerPort: number;
    containerName: string;
    healthCheckPath: string;
    albSecurityGroupId: string;
    listenerArn: string;
  };
  containerConfigs: ApplicationECSContainerDefinitionProps[];
  privateSubnetIds: string[];
  cpu?: number; // defaults to 512
  memory?: number; // defaults to   2048
  launchType?: string; // defaults to 'FARGATE'
  deploymentMinimumHealthyPercent?: number; // defaults to 100
  deploymentMaximumPercent?: number; // defaults to 200
  desiredCount?: number; // defaults to 2
  lifecycleIgnoreChanges?: string[]; // defaults to ['task_definition', 'desired_count', 'load_balancer']
  ecsIamConfig: ApplicationECSIAMProps;
  useCodeDeploy: boolean; //defaults to true
  useTerraformBasedCodeDeploy?: boolean; //defaults to true
  useCodePipeline?: boolean;
  successTerminationWaitTimeInMinutes?: number;
  codeDeployNotifications?: {
    notifyOnStarted?: boolean; //defaults to true
    notifyOnSucceeded?: boolean; //defaults to true
    notifyOnFailed?: boolean; //defaults to true
  };
  efsConfig?: {
    efs: EFSProps;
    volumeName: string;
  };

  codeDeploySnsNotificationTopicArn?: string;
}

export interface EFSProps {
  id: string;
  arn: string;
}
interface ECSTaskDefinitionResponse {
  taskDef: ecsTaskDefinition.EcsTaskDefinition;
  ecrRepos: ecrRepository.EcrRepository[];
}

/**
 * Generates an Application Certificate given a domain name and zoneId
 */
export class ApplicationECSService extends Construct {
  public readonly service: ecsService.EcsService;
  public readonly ecsSecurityGroup: securityGroup.SecurityGroup;
  public readonly mainTargetGroup?: ApplicationTargetGroup;
  public readonly codeDeployApp?: ApplicationECSAlbCodeDeploy;
  public readonly ecrRepos: ecrRepository.EcrRepository[];
  public readonly taskDefinition: ecsTaskDefinition.EcsTaskDefinition;
  public ecsIam: ApplicationECSIAM;
  private readonly config: ApplicationECSServiceProps;

  constructor(
    scope: Construct,
    name: string,
    config: ApplicationECSServiceProps,
  ) {
    super(scope, name);

    // populate defaults for some values if not provided
    this.config = ApplicationECSService.hydrateConfig(config);

    // set default region
    this.config.region = this.config.region ?? defaultRegion;

    this.ecsSecurityGroup = this.setupECSSecurityGroups();
    const { taskDef, ecrRepos } = this.setupECSTaskDefinition();
    this.taskDefinition = taskDef;
    this.ecrRepos = ecrRepos;
    ('');
    //Setup an array of resources that the ecs service will need to depend on
    const ecsServiceDependsOn: TerraformResource[] = [...ecrRepos];

    const ecsNetworkConfig: ecsService.EcsServiceNetworkConfiguration = {
      securityGroups: [this.ecsSecurityGroup.id],
      subnets: config.privateSubnetIds,
    };

    const ecsLoadBalancerConfig: ecsService.EcsServiceLoadBalancer[] = [];

    const targetGroupNames: string[] = [];

    // If we have a alb configuration lets add it.
    if (config.albConfig) {
      this.mainTargetGroup = this.createTargetGroup('blue');
      ecsServiceDependsOn.push(this.mainTargetGroup.targetGroup);
      // Now that we have our service created, we append the alb listener rule to our HTTPS listener.
      const listenerRule = new albListenerRule.AlbListenerRule(
        this,
        'listener_rule',
        {
          listenerArn: this.config.albConfig.listenerArn,
          priority: 1,
          condition: [
            {
              pathPattern: { values: ['*'] },
            },
          ],
          action: [
            {
              type: 'forward',
              targetGroupArn: this.mainTargetGroup.targetGroup.arn,
            },
          ],
          lifecycle: {
            ignoreChanges: ['action'],
          },
          provider: config.provider,
          tags: this.config.tags,
        },
      );
      ecsServiceDependsOn.push(listenerRule);
      targetGroupNames.push(this.mainTargetGroup.targetGroup.name);
      ecsLoadBalancerConfig.push({
        containerName: config.albConfig.containerName,
        containerPort: config.albConfig.containerPort,
        targetGroupArn: this.mainTargetGroup.targetGroup.arn,
      });
    }

    //create ecs service
    this.service = new ecsService.EcsService(this, 'ecs-service', {
      name: `${this.config.prefix}`,
      taskDefinition: taskDef.arn,
      deploymentController: this.config.useCodeDeploy
        ? { type: 'CODE_DEPLOY' }
        : { type: 'ECS' },
      launchType: this.config.launchType,
      deploymentMinimumHealthyPercent:
        this.config.deploymentMinimumHealthyPercent,
      deploymentMaximumPercent: this.config.deploymentMaximumPercent,
      desiredCount: this.config.desiredCount,
      cluster: this.config.ecsClusterArn,
      loadBalancer: ecsLoadBalancerConfig,
      networkConfiguration: ecsNetworkConfig,
      propagateTags: 'SERVICE',
      lifecycle: {
        ignoreChanges: this.config.lifecycleIgnoreChanges,
      },
      tags: this.config.tags,
      dependsOn: ecsServiceDependsOn,
      provider: this.config.provider,
    });

    if (this.config.useCodeDeploy && this.config.albConfig) {
      //Setup a second target group
      const greenTargetGroup = this.createTargetGroup('green');
      targetGroupNames.push(greenTargetGroup.targetGroup.name);
      //Setup codedeploy
      const codeDeployApp = (this.codeDeployApp =
        new ApplicationECSAlbCodeDeploy(this, 'ecs_codedeploy', {
          prefix: this.config.prefix,
          serviceName: this.service.name,
          clusterName: this.config.ecsClusterName,
          targetGroupNames: targetGroupNames,
          listenerArn: this.config.albConfig.listenerArn,
          snsNotificationTopicArn:
            this.config.codeDeploySnsNotificationTopicArn,
          tags: this.config.tags,
          dependsOn: [this.service],
          successTerminationWaitTimeInMinutes:
            this.config.successTerminationWaitTimeInMinutes,
          notifications: this.config.codeDeployNotifications,
          provider: this.config.provider,
        }));

      if (
        !this.config.useCodePipeline &&
        this.config.useTerraformBasedCodeDeploy
      ) {
        /**
         * If you make any changes to the Task Definition this must be called since we ignore changes to it.
         *
         * We typically ignore changes to the following since we rely on BlueGreen Deployments:
         * ALB Default Action Target Group ARN
         * ECS Service LoadBalancer Config
         * ECS Task Definition
         * ECS Placement Strategy Config
         */
        const nullECSTaskUpdate = new Resource(this, 'update-task-definition', {
          triggers: { task_arn: taskDef.arn },
          dependsOn: [
            taskDef,
            codeDeployApp.codeDeployApp,
            codeDeployApp.codeDeployDeploymentGroup,
          ],
        });

        nullECSTaskUpdate.addOverride(
          'provisioner.local-exec.command',
          `export app_spec_content_string='{"version":1,"Resources":[{"TargetService":{"Type":"AWS::ECS::Service","Properties":{"TaskDefinition":"${taskDef.arn}","LoadBalancerInfo":{"ContainerName":"${this.config.albConfig.containerName}","ContainerPort":${this.config.albConfig.containerPort}}}}}]}' && export revision="revisionType=AppSpecContent,appSpecContent={content='$app_spec_content_string'}" && aws --region ${this.config.region} deploy create-deployment  --application-name="${codeDeployApp.codeDeployApp.name}"  --deployment-group-name="${codeDeployApp.codeDeployDeploymentGroup.deploymentGroupName}" --description="Triggered from Terraform/CodeBuild due to a task definition update" --revision="$revision"`,
        );
      }

      // We always create the appspec and taskdef files as long as we have an albConfig
      if (config.albConfig) {
        this.generateAppSpecAndTaskDefFiles(taskDef, config);
      }
    }

    // NEXT STEPS:

    // https://getpocket.atlassian.net/browse/BACK-411
    // build in autoscaling
  }

  // set defaults on optional properties
  private static hydrateConfig(
    config: ApplicationECSServiceProps,
  ): ApplicationECSServiceProps {
    config.launchType = config.launchType || 'FARGATE';
    config.deploymentMinimumHealthyPercent =
      config.deploymentMinimumHealthyPercent || 100;
    config.deploymentMaximumPercent = config.deploymentMaximumPercent || 200;
    config.desiredCount = config.desiredCount || 2;
    //Need to use ?? because useCodeDeploy can be false
    config.useCodeDeploy = config.useCodeDeploy ?? true;
    config.useTerraformBasedCodeDeploy =
      config.useTerraformBasedCodeDeploy ?? true;

    config.lifecycleIgnoreChanges = config.lifecycleIgnoreChanges || [
      'desired_count',
      'load_balancer',
    ];
    if (config.useCodeDeploy) {
      // If we are using CodeDeploy then we need to ignore the task_definition change
      config.lifecycleIgnoreChanges.push('task_definition');
      config.lifecycleIgnoreChanges = [
        // De-dupe array
        ...new Set(config.lifecycleIgnoreChanges),
      ];
    }
    config.cpu = config.cpu || 512;
    config.memory = config.memory || 2048;

    return config;
  }

  /**
   * When running ECS Blue/Green CodeDeploy through CodePipeline, the configuration requires that
   * appspec.json and taskdef.json files exist within the source artifact.
   * This function creates those files as part of the terraform stack
   * @param taskDef
   * @param config
   * @private
   */
  private generateAppSpecAndTaskDefFiles(
    taskDef: ecsTaskDefinition.EcsTaskDefinition,
    config: ApplicationECSServiceProps,
  ) {
    if (config.useCodePipeline) {
      const nullCreateTaskDef = new Resource(
        this,
        'create-task-definition-file',
        {
          triggers: {
            // Sets this null resorce to be triggered on every terraform apply
            alwaysRun: Fn.timestamp(),
          },
          dependsOn: [taskDef],
        },
      );

      // There is no way to pull the task def from the output of the terraform resource.
      // Instead of trying to build a task def ourselves we use a null resource to access the recent version
      // in AWS AFTER we have created our new one.
      // It is also incredibly silly that AWS Codepipeline requires a task definition because it is already getting the
      // Task definition ARN in the app spec file. But you know. Amazon is amazon and we must obey the law.
      nullCreateTaskDef.addOverride(
        'provisioner.local-exec.command',
        `aws --region ${this.config.region} ecs describe-task-definition --task-definition ${taskDef.family} --query 'taskDefinition' >> taskdef.json`,
      );
    }

    new File(this, 'appspec', {
      content: JSON.stringify({
        version: 1,
        Resources: [
          {
            TargetService: {
              Type: 'AWS::ECS::Service',
              Properties: {
                TaskDefinition: taskDef.arn,
                LoadBalancerInfo: {
                  ContainerName: config.albConfig.containerName,
                  ContainerPort: config.albConfig.containerPort,
                },
              },
            },
          },
        ],
      }),
      filename: 'appspec.json',
    });
  }

  /**
   * Sets up the required ECS Security Groups
   * @private
   */
  private setupECSSecurityGroups(): securityGroup.SecurityGroup {
    let ingress: securityGroup.SecurityGroupIngress[] = [];
    if (this.config.albConfig) {
      ingress = [
        {
          fromPort: 80,
          protocol: 'TCP',
          toPort: this.config.albConfig.containerPort,
          securityGroups: [this.config.albConfig.albSecurityGroupId],
          description: 'required',
          cidrBlocks: [],
          ipv6CidrBlocks: [],
          prefixListIds: [],
        },
      ];
    }

    const egress: securityGroup.SecurityGroupEgress[] = [
      {
        fromPort: 0,
        protocol: '-1',
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'required',
        ipv6CidrBlocks: [],
        prefixListIds: [],
        securityGroups: [],
      },
    ];

    return new securityGroup.SecurityGroup(this, `ecs_security_group`, {
      namePrefix: `${this.config.prefix}-ECSSecurityGroup`,
      description: 'Internal ECS Security Group (Managed by Terraform)',
      vpcId: this.config.vpcId,
      ingress,
      egress,
      tags: this.config.tags,
      lifecycle: {
        createBeforeDestroy: true,
      },
      provider: this.config.provider,
    });
  }

  /**
   * Setup the ECS Task Definition
   * @private
   */
  private setupECSTaskDefinition(): ECSTaskDefinitionResponse {
    const ecrRepos: ecrRepository.EcrRepository[] = [];

    const containerDefs = [];
    // Set of unique volumes by volume name
    const volumes: {
      [key: string]: ecsTaskDefinition.EcsTaskDefinitionVolume;
    } = {};

    // figure out if we need to create an ECR for each container definition
    // also build a container definition JSON for each container
    this.config.containerConfigs.forEach((def) => {
      if (def.imageSha && def.containerImage) {
        throw new Error('Only one of imageSha or containerImage can be userd');
      }

      // if an image has been given, it must already live somewhere, so an ECR isn't needed
      if (!def.containerImage) {
        const ecrConfig: ECRProps = {
          name: `${this.config.prefix}-${def.name}`.toLowerCase(),
          tags: this.config.tags,
          provider: this.config.provider,
        };

        const ecr = new ApplicationECR(this, `ecr-${def.name}`, ecrConfig);
        //Set the image to the latest one for now
        def.containerImage = `${ecr.repo.repositoryUrl}:${def.imageSha ?? 'latest'}`;
        //The task and service need to depend on the repository existing.
        ecrRepos.push(ecr.repo);
      }

      // create log group if one not given
      if (!def.logGroup) {
        const cloudwatchLogGroupResource =
          new cloudwatchLogGroup.CloudwatchLogGroup(this, `ecs-${def.name}`, {
            namePrefix: `/ecs/${this.config.prefix}/${def.name}`,
            retentionInDays: 30,
            tags: this.config.tags,
            provider: this.config.provider,
          });

        def.logGroup = cloudwatchLogGroupResource.name;
        def.logGroupRegion = this.config.region;
      }

      if (def.mountPoints) {
        def.mountPoints.forEach((mountPoint) => {
          // We currently only set the volume names, but more configuration is available in EcsTaskDefinitionVolume.
          volumes[mountPoint.sourceVolume] = { name: mountPoint.sourceVolume };
          if (
            this.config.efsConfig &&
            this.config.efsConfig.volumeName === mountPoint.sourceVolume
          ) {
            volumes[mountPoint.sourceVolume] = {
              name: mountPoint.sourceVolume,
              efsVolumeConfiguration: {
                fileSystemId: this.config.efsConfig.efs.id,
              },
            };
          }
        });
      }

      containerDefs.push(buildDefinitionJSON(def));
    });

    this.ecsIam = new ApplicationECSIAM(this, 'ecs-iam', {
      prefix: this.config.prefix,
      tags: this.config.tags,
      taskExecutionDefaultAttachmentArn:
        this.config.ecsIamConfig.taskExecutionDefaultAttachmentArn,
      taskExecutionRolePolicyStatements:
        this.config.ecsIamConfig.taskExecutionRolePolicyStatements,
      taskRolePolicyStatements:
        this.config.ecsIamConfig.taskRolePolicyStatements,
      provider: this.config.provider,
    });

    //Create task definition
    const taskDef = new ecsTaskDefinition.EcsTaskDefinition(this, 'ecs-task', {
      // why are container definitions just JSON? can we get a real construct? sheesh.
      containerDefinitions: `[${containerDefs}]`,
      family: `${this.config.prefix}`,
      executionRoleArn: this.ecsIam.taskExecutionRoleArn,
      taskRoleArn: this.ecsIam.taskRoleArn,
      cpu: this.config.cpu.toString(),
      memory: this.config.memory.toString(),
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      volume: Object.values(volumes),
      tags: this.config.tags,
      dependsOn: ecrRepos,
      provider: this.config.provider,
      skipDestroy: true,
    });

    if (this.config.efsConfig) {
      this.efsFilePolicy(
        this.config.efsConfig.efs,
        this.ecsIam.taskRoleArn,
        this.config.prefix,
      );
      this.createEfsMount(this.config.efsConfig.efs);
    }
    return { taskDef, ecrRepos };
  }

  /**
   * Helper function to get a target group
   * @private
   */
  private createTargetGroup(name: string): ApplicationTargetGroup {
    return new ApplicationTargetGroup(this, `${name}_target_group`, {
      shortName: truncateString(`${this.config.shortName}${name}`, 6),
      vpcId: this.config.vpcId,
      healthCheckPath: this.config.albConfig.healthCheckPath,
      tags: { ...this.config.tags, type: name },
      provider: this.config.provider,
    });
  }

  private createEfsMount(efsFs: EFSProps) {
    const ingress: securityGroup.SecurityGroupIngress[] = [
      {
        // EFS port is not configurable in AWS
        fromPort: 2049,
        protocol: 'TCP',
        toPort: 2049,
        securityGroups: [this.ecsSecurityGroup.id],
        description: 'required',
        cidrBlocks: [],
        ipv6CidrBlocks: [],
        prefixListIds: [],
      },
    ];

    const egress: securityGroup.SecurityGroupEgress[] = [
      {
        fromPort: 0,
        protocol: '-1',
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'required',
        ipv6CidrBlocks: [],
        prefixListIds: [],
        securityGroups: [],
      },
    ];

    const mountSecurityGroup = new securityGroup.SecurityGroup(
      this,
      'efs_mount_sg',
      {
        namePrefix: `${this.config.prefix}-ECSSMountPoint`,
        description: 'ECS EFS Mount (Managed by Terraform)',
        vpcId: this.config.vpcId,
        ingress,
        egress,
        tags: this.config.tags,
        lifecycle: {
          createBeforeDestroy: true,
        },
        provider: this.config.provider,
      },
    );

    // https://developer.hashicorp.com/terraform/cdktf/concepts/iterators
    const iterator = TerraformIterator.fromList(this.config.privateSubnetIds);

    new efsMountTarget.EfsMountTarget(this, 'efs_mount_target', {
      forEach: iterator,
      fileSystemId: efsFs.id,
      subnetId: iterator.value,
      securityGroups: [mountSecurityGroup.id],
      provider: this.config.provider,
    });
  }

  private efsFilePolicy(
    efsFs: EFSProps,
    roleArn: string,
    creationToken: string,
  ) {
    const FsPolicy = {
      Version: '2012-10-17',
      Id: creationToken,
      Statement: [
        {
          Sid: creationToken,
          Effect: 'Allow',
          Principal: {
            AWS: '*',
          },
          Resource: efsFs.arn,
          Action: [
            'elasticfilesystem:ClientMount',
            'elasticfilesystem:ClientWrite',
            'elasticfilesystem:ClientRootAccess',
          ],
          Condition: {
            Bool: {
              'elasticfilesystem:AccessedViaMountTarget': 'true',
            },
          },
        },
      ],
    };

    const waitTwoMinutes = new Sleep(this, 'waitTwoMinutes', {
      createDuration: '2m',
      dependsOn: [this.ecsIam.taskRoleArn],
    });

    new efsFileSystemPolicy.EfsFileSystemPolicy(this, 'efsFsPolicy', {
      fileSystemId: efsFs.id,
      policy: JSON.stringify(FsPolicy),
      // https://github.com/hashicorp/terraform-provider-aws/pull/21734
      dependsOn: [waitTwoMinutes],
      provider: this.config.provider,
    });
  }
}

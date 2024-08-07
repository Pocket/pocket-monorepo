import {
  iamRole,
  iamRolePolicyAttachment,
  dataAwsIamPolicyDocument,
  dataAwsRegion,
  dataAwsCallerIdentity,
  codestarnotificationsNotificationRule,
  codedeployApp,
  codedeployDeploymentGroup,
} from '@cdktf/provider-aws';
import {
  TerraformMetaArguments,
  TerraformOutput,
  TerraformResource,
} from 'cdktf';
import { Construct } from 'constructs';

export interface ApplicationECSAlbCodeDeployProps
  extends TerraformMetaArguments {
  prefix: string;
  clusterName: string;
  serviceName: string;
  listenerArn: string;
  snsNotificationTopicArn?: string;
  targetGroupNames: string[];
  tags?: { [key: string]: string };
  dependsOn?: TerraformResource[];
  successTerminationWaitTimeInMinutes?: number;
  notifications?: {
    notifyOnStarted?: boolean;
    notifyOnSucceeded?: boolean;
    notifyOnFailed?: boolean;
  };
}

interface CodeDeployResponse {
  codeDeployApp: codedeployApp.CodedeployApp;
  ecsCodeDeployRole: iamRole.IamRole;
}

/**
 * Represents a ecs Codeploy App that uses an ALB
 */
export class ApplicationECSAlbCodeDeploy extends Construct {
  private readonly config: ApplicationECSAlbCodeDeployProps;

  public readonly codeDeployApp: codedeployApp.CodedeployApp;
  public readonly codeDeployDeploymentGroup: codedeployDeploymentGroup.CodedeployDeploymentGroup;

  constructor(
    scope: Construct,
    name: string,
    config: ApplicationECSAlbCodeDeployProps,
  ) {
    super(scope, name);

    this.config = config;

    const { codeDeployApp, ecsCodeDeployRole } = this.setupCodeDeployApp();
    this.codeDeployApp = codeDeployApp;

    this.codeDeployDeploymentGroup =
      new codedeployDeploymentGroup.CodedeployDeploymentGroup(
        this,
        `ecs_codedeploy_deployment_group`,
        {
          dependsOn: config.dependsOn,
          appName: codeDeployApp.name,
          deploymentConfigName: 'CodeDeployDefault.ECSAllAtOnce',
          deploymentGroupName: `${this.config.prefix}-ECS`,
          serviceRoleArn: ecsCodeDeployRole.arn,
          autoRollbackConfiguration: {
            enabled: true,
            events: ['DEPLOYMENT_FAILURE'],
          },
          blueGreenDeploymentConfig: {
            deploymentReadyOption: {
              actionOnTimeout: 'CONTINUE_DEPLOYMENT',
            },
            terminateBlueInstancesOnDeploymentSuccess: {
              action: 'TERMINATE',
              terminationWaitTimeInMinutes:
                (this.config.successTerminationWaitTimeInMinutes ??= 5),
            },
          },
          deploymentStyle: {
            deploymentOption: 'WITH_TRAFFIC_CONTROL',
            deploymentType: 'BLUE_GREEN',
          },
          ecsService: {
            clusterName: this.config.clusterName,
            serviceName: this.config.serviceName,
          },
          loadBalancerInfo: {
            targetGroupPairInfo: {
              prodTrafficRoute: { listenerArns: [this.config.listenerArn] },
              targetGroup: this.config.targetGroupNames.map((name) => {
                return { name };
              }),
            },
          },
          tags: this.config.tags,
          provider: this.config.provider,
        },
      );

    new TerraformOutput(this, 'ecs-codedeploy-app', {
      description: 'ECS Code Deploy App',
      value: this.codeDeployApp.name,
      staticId: true,
    });

    new TerraformOutput(this, 'ecs-codedeploy-group', {
      description: 'ECS Code Deploy Group',
      value: this.codeDeployDeploymentGroup.deploymentGroupName,
      staticId: true,
    });
  }

  /**
   * Set configuration for code deploy notifications
   * @param notifyOnStarted
   * @param notifyOnSucceeded
   * @param notifyOnFailed
   * @returns An array of EventTypeIds
   */

  private getEventTypeIds(
    notifyOnStarted = true,
    notifyOnSucceeded = true,
    notifyOnFailed = true,
  ): string[] {
    const eventTypeIds: string[] = [];

    if (notifyOnFailed) {
      eventTypeIds.push('codedeploy-application-deployment-failed');
    }

    if (notifyOnSucceeded) {
      eventTypeIds.push('codedeploy-application-deployment-succeeded');
    }

    if (notifyOnStarted) {
      eventTypeIds.push('codedeploy-application-deployment-started');
    }

    return eventTypeIds;
  }

  /**
   * Setup the codedeploy app, permissions, and notifications
   * @private
   */
  private setupCodeDeployApp(): CodeDeployResponse {
    const ecsCodeDeployRole = new iamRole.IamRole(
      this,
      'ecs_code_deploy_role',
      {
        name: `${this.config.prefix}-ECSCodeDeployRole`,
        assumeRolePolicy: new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
          this,
          `codedeploy_assume_role`,
          {
            statement: [
              {
                effect: 'Allow',
                actions: ['sts:AssumeRole'],
                principals: [
                  {
                    identifiers: ['codedeploy.amazonaws.com'],
                    type: 'Service',
                  },
                ],
              },
            ],
          },
        ).json,
        tags: this.config.tags,
        provider: this.config.provider,
      },
    );

    new iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ecs_codedeploy_role_attachment',
      {
        policyArn: 'arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS',
        role: ecsCodeDeployRole.name,
        dependsOn: [ecsCodeDeployRole],
        provider: this.config.provider,
      },
    );

    const codeDeployApp = new codedeployApp.CodedeployApp(
      this,
      'ecs_code_deploy',
      {
        computePlatform: 'ECS',
        name: `${this.config.prefix}-ECS`,
        tags: this.config.tags,
        provider: this.config.provider,
      },
    );

    if (this.config.snsNotificationTopicArn) {
      const region = new dataAwsRegion.DataAwsRegion(this, 'current_region', {
        provider: this.config.provider,
      });
      const account = new dataAwsCallerIdentity.DataAwsCallerIdentity(
        this,
        'current_account',
        {
          provider: this.config.provider,
        },
      );
      new codestarnotificationsNotificationRule.CodestarnotificationsNotificationRule(
        this,
        `ecs_codedeploy_notifications`,
        {
          detailType: 'BASIC',
          eventTypeIds: this.getEventTypeIds(
            this.config.notifications?.notifyOnStarted,
            this.config.notifications?.notifyOnSucceeded,
            this.config.notifications?.notifyOnFailed,
          ),
          name: codeDeployApp.name,
          resource: `arn:aws:codedeploy:${region.name}:${account.accountId}:application:${codeDeployApp.name}`,
          target: [
            {
              address: this.config.snsNotificationTopicArn,
            },
          ],
          tags: this.config.tags,
          provider: this.config.provider,
        },
      );
    }

    return { codeDeployApp, ecsCodeDeployRole };
  }
}

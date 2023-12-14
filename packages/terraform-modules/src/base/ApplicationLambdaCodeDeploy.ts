import { CodedeployApp } from '@cdktf/provider-aws/lib/codedeploy-app';
import { CodedeployDeploymentGroup } from '@cdktf/provider-aws/lib/codedeploy-deployment-group';
import { CodestarnotificationsNotificationRule } from '@cdktf/provider-aws/lib/codestarnotifications-notification-rule';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';

export interface ApplicationVersionedLambdaCodeDeployProps
  extends TerraformMetaArguments {
  name: string;
  deploySnsTopicArn?: string;
  detailType?: 'BASIC' | 'FULL';
  region: string;
  accountId: string;
  tags?: { [key: string]: string };
  notifications?: {
    /**
     * Option to send CodeDeploy notifications on Started event, defaults to false.
     */
    notifyOnStarted?: boolean;
    /**
     * Option to send CodeDeploy notifications on Succeeded event, defaults to false.
     */
    notifyOnSucceeded?: boolean;
    /**
     * Option to send CodeDeploy notifications on Failed event, defaults to true.
     */
    notifyOnFailed?: boolean;
  };
}

export class ApplicationLambdaCodeDeploy extends Construct {
  public readonly codeDeployApp: CodedeployApp;

  constructor(
    scope: Construct,
    name: string,
    private config: ApplicationVersionedLambdaCodeDeployProps,
  ) {
    super(scope, name);

    this.codeDeployApp = this.setupCodeDeploy();
  }

  private setupCodeDeploy() {
    const codeDeployApp = new CodedeployApp(this, 'code-deploy-app', {
      name: `${this.config.name}-Lambda`,
      computePlatform: 'Lambda',
      provider: this.config.provider,
      tags: this.config.tags,
    });

    this.createCodeDeploymentGroup(codeDeployApp);

    if (this.config.deploySnsTopicArn) {
      this.setupCodeDeployNotifications(codeDeployApp);
    }

    return codeDeployApp;
  }

  private createCodeDeploymentGroup(codeDeployApp: CodedeployApp) {
    new CodedeployDeploymentGroup(this, 'code-deployment-group', {
      appName: codeDeployApp.name,
      deploymentConfigName: 'CodeDeployDefault.LambdaAllAtOnce',
      deploymentGroupName: codeDeployApp.name,
      serviceRoleArn: this.getCodeDeployRole().arn,
      deploymentStyle: {
        deploymentType: 'BLUE_GREEN',
        deploymentOption: 'WITH_TRAFFIC_CONTROL',
      },
      autoRollbackConfiguration: {
        enabled: true,
        events: ['DEPLOYMENT_FAILURE'],
      },
      dependsOn: [codeDeployApp],
      provider: this.config.provider,
      tags: this.config.tags,
    });
  }

  private getCodeDeployRole() {
    const codeDeployRole = new IamRole(this, 'code-deploy-role', {
      name: `${this.config.name}-CodeDeployRole`,
      assumeRolePolicy: this.getCodeDeployAssumePolicyDocument(),
      provider: this.config.provider,
      tags: this.config.tags,
    });

    new IamRolePolicyAttachment(this, 'code-deploy-policy-attachment', {
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda',
      role: codeDeployRole.name,
      dependsOn: [codeDeployRole],
      provider: this.config.provider,
    });

    return codeDeployRole;
  }

  private getCodeDeployAssumePolicyDocument() {
    return new DataAwsIamPolicyDocument(
      this,
      'code-deploy-assume-role-policy-document',
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
        provider: this.config.provider,
      },
    ).json;
  }

  private setupCodeDeployNotifications(codeDeployApp: CodedeployApp) {
    const eventTypeIds = [];

    // the OR condition here sets the notification for failed deploys which is a default when no notification preferences are provided
    if (
      this.config.notifications?.notifyOnFailed ||
      this.config.notifications?.notifyOnFailed === undefined
    ) {
      eventTypeIds.push('codedeploy-application-deployment-failed');
    }

    if (this.config.notifications?.notifyOnSucceeded) {
      eventTypeIds.push('codedeploy-application-deployment-succeeded');
    }

    if (this.config.notifications?.notifyOnStarted) {
      eventTypeIds.push('codedeploy-application-deployment-started');
    }

    new CodestarnotificationsNotificationRule(this, 'notifications', {
      detailType: this.config.detailType ?? 'BASIC',
      eventTypeIds: eventTypeIds,
      name: codeDeployApp.name,
      resource: `arn:aws:codedeploy:${this.config.region}:${this.config.accountId}:application:${codeDeployApp.name}`,
      target: [
        {
          address: this.config.deploySnsTopicArn,
        },
      ],
      provider: this.config.provider,
      tags: this.config.tags,
    });
  }
}

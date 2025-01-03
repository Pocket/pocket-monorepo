import {
  codedeployApp,
  codedeployDeploymentGroup,
  codestarnotificationsNotificationRule,
  dataAwsIamPolicyDocument,
  iamRole,
  iamRolePolicyAttachment,
} from '@cdktf/provider-aws';
import { TerraformMetaArguments, TerraformOutput } from 'cdktf';
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
  public readonly codeDeployApp: codedeployApp.CodedeployApp;
  public readonly codeDeployGroup: codedeployDeploymentGroup.CodedeployDeploymentGroup;

  constructor(
    scope: Construct,
    name: string,
    private config: ApplicationVersionedLambdaCodeDeployProps,
  ) {
    super(scope, name);

    const { codeDeployApp, codeDeployGroup } = this.setupCodeDeploy();
    this.codeDeployApp = codeDeployApp;
    this.codeDeployGroup = codeDeployGroup;

    new TerraformOutput(this, 'lambda_codedeploy_app', {
      value: this.codeDeployApp.name,
      description: 'Lambda CodeDeploy App Name',
    });

    new TerraformOutput(this, 'lambda_codedeploy_group', {
      value: this.codeDeployGroup.deploymentGroupName,
      description: 'Lambda CodeDeploy Group Name',
    });
  }

  private setupCodeDeploy() {
    const codeDeployApp = new codedeployApp.CodedeployApp(
      this,
      'code-deploy-app',
      {
        name: `${this.config.name}-Lambda`,
        computePlatform: 'Lambda',
        provider: this.config.provider,
        tags: this.config.tags,
      },
    );

    const codeDeployGroup = this.createCodeDeploymentGroup(codeDeployApp);

    if (this.config.deploySnsTopicArn) {
      this.setupCodeDeployNotifications(codeDeployApp);
    }

    return { codeDeployApp, codeDeployGroup };
  }

  private createCodeDeploymentGroup(
    codeDeployApp: codedeployApp.CodedeployApp,
  ) {
    return new codedeployDeploymentGroup.CodedeployDeploymentGroup(
      this,
      'code-deployment-group',
      {
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
      },
    );
  }

  private getCodeDeployRole() {
    const codeDeployRole = new iamRole.IamRole(this, 'code-deploy-role', {
      name: `${this.config.name}-CodeDeployRole`,
      assumeRolePolicy: this.getCodeDeployAssumePolicyDocument(),
      provider: this.config.provider,
      tags: this.config.tags,
    });

    new iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'code-deploy-policy-attachment',
      {
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda',
        role: codeDeployRole.name,
        dependsOn: [codeDeployRole],
        provider: this.config.provider,
      },
    );

    return codeDeployRole;
  }

  private getCodeDeployAssumePolicyDocument() {
    return new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
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

  private setupCodeDeployNotifications(
    codeDeployApp: codedeployApp.CodedeployApp,
  ) {
    if (this.config.deploySnsTopicArn === undefined) {
      throw new Error('deploySnsTopicArn is required for notifications');
    }
    const eventTypeIds: string[] = [];

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

    new codestarnotificationsNotificationRule.CodestarnotificationsNotificationRule(
      this,
      'notifications',
      {
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
      },
    );
  }
}

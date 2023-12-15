import {
  DataAwsIamPolicyDocumentStatement,
  DataAwsIamPolicyDocument,
} from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';

export interface ApplicationECSIAMProps extends TerraformMetaArguments {
  prefix: string;
  taskExecutionRolePolicyStatements: DataAwsIamPolicyDocumentStatement[];
  taskRolePolicyStatements: DataAwsIamPolicyDocumentStatement[];
  taskExecutionDefaultAttachmentArn?: string;
  tags?: { [key: string]: string };
}

export class ApplicationECSIAM extends Construct {
  public readonly taskExecutionRoleArn;
  public readonly taskRoleArn;
  public readonly taskRole: IamRole;

  constructor(scope: Construct, name: string, config: ApplicationECSIAMProps) {
    super(scope, name);

    // does anything here need to be in config?
    const dataEcsTaskAssume = new DataAwsIamPolicyDocument(
      this,
      'ecs-task-assume',
      {
        version: '2012-10-17',
        statement: [
          {
            effect: 'Allow',
            actions: ['sts:AssumeRole'],
            principals: [
              {
                identifiers: ['ecs-tasks.amazonaws.com'],
                type: 'Service',
              },
            ],
          },
        ],
        provider: config.provider,
      },
    );

    const ecsTaskExecutionRole = new IamRole(this, 'ecs-execution-role', {
      assumeRolePolicy: dataEcsTaskAssume.json,
      name: `${config.prefix}-TaskExecutionRole`,
      tags: config.tags,
      provider: config.provider,
    });

    if (config.taskExecutionDefaultAttachmentArn) {
      new IamRolePolicyAttachment(
        this,
        'ecs-task-execution-default-attachment',
        {
          policyArn: config.taskExecutionDefaultAttachmentArn,
          role: ecsTaskExecutionRole.id,
          provider: config.provider,
        },
      );
    }

    if (config.taskExecutionRolePolicyStatements.length > 0) {
      const dataEcsTaskExecutionRolePolicy = new DataAwsIamPolicyDocument(
        this,
        'data-ecs-task-execution-role-policy',
        {
          version: '2012-10-17',
          statement: config.taskExecutionRolePolicyStatements,
          provider: config.provider,
        },
      );

      const ecsTaskExecutionRolePolicy = new IamPolicy(
        this,
        'ecs-task-execution-role-policy',
        {
          name: `${config.prefix}-TaskExecutionRolePolicy`,
          policy: dataEcsTaskExecutionRolePolicy.json,
          provider: config.provider,
          tags: config.tags,
        },
      );

      new IamRolePolicyAttachment(
        this,
        'ecs-task-execution-custom-attachment',
        {
          policyArn: ecsTaskExecutionRolePolicy.arn,
          role: ecsTaskExecutionRole.id,
          provider: config.provider,
        },
      );
    }

    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      assumeRolePolicy: dataEcsTaskAssume.json,
      name: `${config.prefix}-TaskRole`,
      tags: config.tags,
      provider: config.provider,
    });

    if (config.taskRolePolicyStatements.length > 0) {
      const dataEcsTaskRolePolicy = new DataAwsIamPolicyDocument(
        this,
        'data-ecs-task-role-policy',
        {
          version: '2012-10-17',
          statement: config.taskRolePolicyStatements,
          provider: config.provider,
        },
      );

      const ecsTaskRolePolicy = new IamPolicy(this, 'ecs-task-role-policy', {
        name: `${config.prefix}-TaskRolePolicy`,
        policy: dataEcsTaskRolePolicy.json,
        provider: config.provider,
        tags: config.tags,
      });

      new IamRolePolicyAttachment(this, 'ecs-task-custom-attachment', {
        policyArn: ecsTaskRolePolicy.arn,
        role: ecsTaskRole.id,
        provider: config.provider,
      });
    }

    // make arns available to other modules
    this.taskExecutionRoleArn = ecsTaskExecutionRole.arn;
    this.taskRoleArn = ecsTaskRole.arn;
    this.taskRole = ecsTaskRole;
  }
}

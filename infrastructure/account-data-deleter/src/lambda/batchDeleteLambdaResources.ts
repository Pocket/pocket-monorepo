import { config, config as stackConfig } from '../config/index.js';

import {
  dataAwsSsmParameter,
  dataAwsIamPolicyDocument,
  dynamodbTable,
  iamPolicy,
  iamRolePolicyAttachment,
  iamRole,
  lambdaPermission,
} from '@cdktf/provider-aws';
import {
  ApplicationDynamoDBTable,
  ApplicationDynamoDBTableCapacityMode,
  ApplicationEventBridgeRule,
  LAMBDA_RUNTIMES,
  PocketVersionedLambda,
  PocketVPC,
} from '@pocket-tools/terraform-modules';

import { Construct } from 'constructs';

export class BatchDeleteLambdaResources extends Construct {
  public readonly historicalDeletedUsers: ApplicationDynamoDBTable;
  public readonly processedDeletedUsers: ApplicationDynamoDBTable;
  public readonly batchDeleteLambda: PocketVersionedLambda;
  constructor(
    scope: Construct,
    private name: string,
    private vpc: PocketVPC,
  ) {
    super(scope, name.toLowerCase());

    const { sentryDsn } = this.getEnvVariableValues();

    // Tables for retrieving historically deleted user ID lists
    // and keeping track of which ones have been processed
    this.historicalDeletedUsers = this.createHistoricalDeletedUsersTable();
    this.processedDeletedUsers = this.createProcessedUsersTable();

    // lambda fetches the userId from the dynamoDb in batches and calls deleteMutation
    // The IDs are then moved to a separate table for record-keeping
    this.batchDeleteLambda = new PocketVersionedLambda(
      this,
      'batch-delete-lambda',
      {
        name: `${stackConfig.prefix}-${stackConfig.lambda.batchDeleteLambda.name}`,
        lambda: {
          description:
            'batch delete lambda that gets id from dynamoDb and calls deleteMutation',
          runtime: LAMBDA_RUNTIMES.NODEJS20,
          handler: 'index.handler',
          reservedConcurrencyLimit:
            stackConfig.lambda.batchDeleteLambda.reservedConcurrencyLimit,
          timeout: 120,
          environment: {
            SENTRY_DSN: sentryDsn,
            ENVIRONMENT:
              stackConfig.environment === 'Prod' ? 'production' : 'development',
            NODE_ENV:
              stackConfig.environment === 'Prod' ? 'production' : 'development',
            USER_API: `https://${stackConfig.userApiDomain}`,
          },
          ignoreEnvironmentVars: ['GIT_SHA'],
          vpcConfig: {
            securityGroupIds: this.vpc.defaultSecurityGroups.ids,
            subnetIds: this.vpc.privateSubnetIds,
          },
          codeDeploy: {
            region: this.vpc.region,
            accountId: this.vpc.accountId,
          },
          alarms: {},
        },
        tags: stackConfig.tags,
      },
    );

    this.addDynamoPermissions(
      config.lambda.batchDeleteLambda.name,
      this.batchDeleteLambda.lambda.lambdaExecutionRole,
      [
        this.historicalDeletedUsers.dynamodb,
        this.processedDeletedUsers.dynamodb,
      ],
      ['dynamodb:*'],
    );

    if (!config.isDev) {
      this.addScheduledEventToInvokeLambda();
    }
  }

  /**
   * function to create scheduled event that triggers the batchDelete lambda
   * schedule frequency is set in `triggerInMinutes` in config file
   * Sets permission for event to invoke lambda.
   * @private
   * @returns cloudwatch event
   */
  private addScheduledEventToInvokeLambda() {
    //cloudwatch event that triggers the batchDeleteLambda
    //when this event is processed, lambda scheduled next `maxBatchSize`userIds for deletion
    const scheduledEvent = new ApplicationEventBridgeRule(
      this,
      'add-batchDelete-lambda-trigger',
      {
        description: 'event to trigger AccountDeletion- batchDeleteLambda',
        name: `${config.prefix}-BatchDelete-Lambda-Trigger`,
        //todo: set proper limit after testing
        scheduleExpression: `rate(${config.lambda.batchDeleteLambda.triggerInHours} hours)`,
        targets: [
          {
            arn: this.batchDeleteLambda.lambda.defaultLambda.arn,
            targetId: `${config.prefix}-BatchDeleteLambda-Rule-Target`,
          },
        ],
      },
    );

    //permission for scheduledEvent to invoke the batchDeleteLambda
    new lambdaPermission.LambdaPermission(
      this,
      `${config.prefix}-batchLambda-permission`,
      {
        principal: 'events.amazonaws.com',
        action: 'lambda:InvokeFunction',
        functionName: this.batchDeleteLambda.lambda.defaultLambda.arn,
        sourceArn: scheduledEvent.rule.arn,
      },
    );
  }

  private getEnvVariableValues() {
    const sentryDsn = new dataAwsSsmParameter.DataAwsSsmParameter(
      this,
      'sentry-dsn',
      {
        name: `/${stackConfig.name}/${stackConfig.environment}/SENTRY_DSN`,
      },
    );

    return { sentryDsn: sentryDsn.value };
  }

  /**
   * Sets up the dynamodb table that contains a list of historically
   * deleted ("soft-deleted") user IDs
   * @private
   */
  private createHistoricalDeletedUsersTable() {
    const tableName = config.dynamodb.historicalDeletedUsers.tableName;
    return new ApplicationDynamoDBTable(this, tableName, {
      tags: config.tags,
      prefix: `${config.shortName}-${tableName}`,
      capacityMode: ApplicationDynamoDBTableCapacityMode.ON_DEMAND,
      preventDestroyTable: true,
      tableConfig: {
        pointInTimeRecovery: {
          enabled: true,
        },
        hashKey: config.dynamodb.historicalDeletedUsers.key,
        attribute: [
          {
            name: config.dynamodb.historicalDeletedUsers.key,
            type: 'N',
          },
        ],
      },
    });
  }

  /**
   * Sets up the dynamodb table that contains the list of historically
   * deleted ("soft-deleted") user IDs which have been submitted for
   * the "hard-delete" process.
   * @private
   */
  private createProcessedUsersTable() {
    const tableName = config.dynamodb.processedDeletedUsers.tableName;
    return new ApplicationDynamoDBTable(this, tableName, {
      tags: config.tags,
      prefix: `${config.shortName}-${tableName}`,
      capacityMode: ApplicationDynamoDBTableCapacityMode.ON_DEMAND,
      preventDestroyTable: true,
      tableConfig: {
        pointInTimeRecovery: {
          enabled: true,
        },
        hashKey: config.dynamodb.processedDeletedUsers.key,
        attribute: [
          {
            name: config.dynamodb.processedDeletedUsers.key,
            type: 'N',
          },
        ],
      },
    });
  }

  /**
   * Lambda should have full access to manage dynamodb table
   * @param lambdaExecutionRole
   * @param dynamoTable
   */
  private addDynamoPermissions(
    name: string,
    lambdaExecutionRole: iamRole.IamRole,
    dynamoTables: dynamodbTable.DynamodbTable[],
    actions: string[],
  ) {
    const resources = dynamoTables.map((_) => _.arn);
    const policy = new iamPolicy.IamPolicy(
      this,
      `${name}-lambda-dynamo-policy`,
      {
        name: `${this.name}-${name}-DynamoLambdaPolicy`,
        policy: new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
          this,
          `${name}-lambda-dynamo-policy-doc`,
          {
            statement: [
              {
                effect: 'Allow',
                actions,
                resources,
              },
            ],
          },
        ).json,
        dependsOn: [lambdaExecutionRole],
      },
    );
    return new iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      `${name}-execution-role-policy-attachment`,
      {
        role: lambdaExecutionRole.name,
        policyArn: policy.arn,
        dependsOn: [lambdaExecutionRole, policy],
      },
    );
  }
}

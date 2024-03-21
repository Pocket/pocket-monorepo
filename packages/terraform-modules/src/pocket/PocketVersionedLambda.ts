import { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';
import {
  ApplicationVersionedLambda,
  LAMBDA_RUNTIMES,
} from '../base/ApplicationVersionedLambda.js';
import { ApplicationLambdaCodeDeploy } from '../base/ApplicationLambdaCodeDeploy.js';
import {
  cloudwatchMetricAlarm,
  dataAwsIamPolicyDocument,
  lambdaFunction,
} from '@cdktf/provider-aws';

export interface PocketVersionedLambdaDefaultAlarmProps {
  threshold: number;
  period: number;
  evaluationPeriods?: number;
  datapointsToAlarm?: number;
  comparisonOperator?:
    | 'GreaterThanOrEqualToThreshold'
    | 'GreaterThanThreshold'
    | 'GreaterThanUpperThreshold'
    | 'LessThanLowerOrGreaterThanUpperThreshold'
    | 'LessThanLowerThreshold'
    | 'LessThanOrEqualToThreshold'
    | 'LessThanThreshold';
  alarmDescription?: string;
  actions?: string[];
  treatMissingData?: 'missing' | 'notBreaching' | 'breaching' | 'ignore';
}

export interface PocketVersionedLambdaProps extends TerraformMetaArguments {
  name: string;
  lambda: {
    description?: string;
    runtime: LAMBDA_RUNTIMES;
    handler: string;
    timeout?: number;
    reservedConcurrencyLimit?: number;
    memorySizeInMb?: number;
    environment?: { [key: string]: string };
    vpcConfig?: lambdaFunction.LambdaFunctionVpcConfig;
    executionPolicyStatements?: dataAwsIamPolicyDocument.DataAwsIamPolicyDocumentStatement[];
    logRetention?: number;
    s3Bucket?: string;
    codeDeploy?: {
      deploySnsTopicArn?: string;
      detailType?: 'BASIC' | 'FULL';
      region: string;
      accountId: string;
      notifications?: {
        notifyOnStarted?: boolean;
        notifyOnSucceeded?: boolean;
        notifyOnFailed?: boolean;
      };
    };
    alarms?: {
      invocations?: PocketVersionedLambdaDefaultAlarmProps;
      errors?: PocketVersionedLambdaDefaultAlarmProps;
      concurrentExecutions?: PocketVersionedLambdaDefaultAlarmProps;
      throttles?: PocketVersionedLambdaDefaultAlarmProps;
      duration?: PocketVersionedLambdaDefaultAlarmProps;
    };
  };
  tags?: { [key: string]: string };
}

export class PocketVersionedLambda extends Construct {
  public readonly lambda: ApplicationVersionedLambda;
  constructor(
    scope: Construct,
    name: string,
    protected readonly config: PocketVersionedLambdaProps,
  ) {
    super(scope, name);

    PocketVersionedLambda.validateConfig(config);

    this.lambda = this.createVersionedLambda();

    if (config.lambda.codeDeploy) {
      this.createLambdaCodeDeploy();
    }

    if (config.lambda.alarms) {
      this.createLambdaAlarms(this.lambda);
    }
  }

  private static validateConfig(config: PocketVersionedLambdaProps): void {
    if (!config.lambda.alarms) return;

    const alarms = {
      invocations: 'Invocations',
      errors: 'Errors',
      concurrentExecutions: 'Concurrent Executions',
      throttles: 'Throttles',
      duration: 'Duration',
    };

    const errorMessage =
      'DatapointsToAlarm must be less than or equal to EvaluationPeriods';

    const alarmsConfig = config.lambda.alarms;

    Object.keys(alarms).forEach((key) => {
      if (
        alarmsConfig[key]?.datapointsToAlarm >
        (alarmsConfig[key]?.evaluationPeriods ?? 1)
      ) {
        throw new Error(`${alarms[key]} Alarm: ${errorMessage}`);
      }
    });
  }

  private createLambdaAlarms(lambda: ApplicationVersionedLambda): void {
    const alarmsConfig = this.config.lambda.alarms;

    const alarms = {
      invocations: 'Invocations',
      errors: 'Errors',
      concurrentExecutions: 'ConcurrentExecutions',
      throttles: 'Throttles',
      duration: 'Duration',
    };

    Object.keys(alarms).forEach((name) => {
      if (alarmsConfig[name]) {
        this.createLambdaAlarm(lambda, {
          metricName: alarms[name],
          props: this.config.lambda.alarms[name],
        });
      }
    });
  }

  private createLambdaAlarm(
    lambda: ApplicationVersionedLambda,
    config: {
      metricName: string;
      props: PocketVersionedLambdaDefaultAlarmProps;
    },
  ): void {
    const props = config.props;
    const defaultEvaluationPeriods = 1;

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      config.metricName.toLowerCase(),
      {
        alarmName: `${this.config.name}-Lambda-${config.metricName}-Alarm`,
        namespace: 'AWS/Lambda',
        metricName: config.metricName,
        dimensions: {
          FunctionName: lambda.versionedLambda.functionName,
          Resource: `${lambda.versionedLambda.functionName}:${lambda.versionedLambda.name}`,
        },
        period: props.period,
        evaluationPeriods: props.evaluationPeriods ?? defaultEvaluationPeriods,
        datapointsToAlarm: props.datapointsToAlarm ?? defaultEvaluationPeriods,
        statistic: 'Sum',
        comparisonOperator: props.comparisonOperator ?? 'GreaterThanThreshold',
        threshold: props.threshold,
        alarmDescription:
          props.alarmDescription ??
          `Total ${config.metricName.toLowerCase()} breaches threshold`,
        insufficientDataActions: [],
        alarmActions: props.actions ?? [],
        okActions: props.actions ?? [],
        tags: this.config.tags,
        treatMissingData: props.treatMissingData ?? 'missing',
      },
    );
  }

  private createLambdaCodeDeploy(): void {
    const lambdaConfig = this.config.lambda;

    new ApplicationLambdaCodeDeploy(this, 'lambda-code-deploy', {
      name: this.config.name,
      deploySnsTopicArn: lambdaConfig.codeDeploy.deploySnsTopicArn,
      detailType: lambdaConfig.codeDeploy.detailType,
      region: lambdaConfig.codeDeploy.region,
      accountId: lambdaConfig.codeDeploy.accountId,
      notifications: lambdaConfig.codeDeploy.notifications,
    });
  }

  private createVersionedLambda(): ApplicationVersionedLambda {
    const lambdaConfig = this.config.lambda;

    return new ApplicationVersionedLambda(this, 'lambda', {
      name: this.config.name,
      description: lambdaConfig.description,
      runtime: lambdaConfig.runtime,
      handler: lambdaConfig.handler,
      timeout: lambdaConfig.timeout,
      environment: lambdaConfig.environment,
      vpcConfig: lambdaConfig.vpcConfig,
      executionPolicyStatements: lambdaConfig.executionPolicyStatements,
      logRetention: lambdaConfig.logRetention,
      s3Bucket:
        lambdaConfig.s3Bucket ?? `pocket-${this.config.name.toLowerCase()}`,
      tags: this.config.tags,
      usesCodeDeploy: !!lambdaConfig.codeDeploy,
      memorySizeInMb: lambdaConfig.memorySizeInMb,
      reservedConcurrencyLimit: lambdaConfig.reservedConcurrencyLimit,
    });
  }
}

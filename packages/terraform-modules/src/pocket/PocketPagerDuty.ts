import { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';
import { snsTopicSubscription, snsTopic } from '@cdktf/provider-aws';
import {
  dataPagerdutyVendor,
  service,
  serviceIntegration,
} from '@cdktf/provider-pagerduty';

export interface PocketPagerDutyProps extends TerraformMetaArguments {
  prefix: string;
  service: {
    autoResolveTimeout?: number;
    acknowledgementTimeout?: number;
    criticalEscalationPolicyId: string;
    nonCriticalEscalationPolicyId: string;
  };
  sns?: {
    topic?: {
      tags?: { [key: string]: string };
    };
    subscription?: {
      confirmationTimeoutInMinutes?: number;
    };
  };
}

export enum PAGERDUTY_SERVICE_URGENCY {
  CRITICAL = 'Critical',
  NON_CRITICAL = 'Non-Critical',
}

export class PocketPagerDuty extends Construct {
  static readonly SERVICE_AUTO_RESOLVE_TIMEOUT = '14400';
  static readonly SERVICE_ACKNOWLEDGEMENT_TIMEOUT = '1800'; // 30 minutes
  static readonly SNS_SUBSCRIPTION_CONFIRMATION_TIMEOUT_IN_MINUTES = 2;
  public readonly snsCriticalAlarmTopic: snsTopic.SnsTopic;
  public readonly snsNonCriticalAlarmTopic: snsTopic.SnsTopic;
  private config: PocketPagerDutyProps;

  constructor(scope: Construct, name: string, config: PocketPagerDutyProps) {
    super(scope, name);

    this.config = config;

    const sentryVendor = this.getVendor('Sentry');

    const cloudwatchVendor = this.getVendor('Cloudwatch');

    const pagerDutyCritical = this.createService(
      PAGERDUTY_SERVICE_URGENCY.CRITICAL,
    );

    const pagerDutyNonCritical = this.createService(
      PAGERDUTY_SERVICE_URGENCY.NON_CRITICAL,
    );

    this.createServiceIntegration(
      sentryVendor,
      pagerDutyCritical,
      PAGERDUTY_SERVICE_URGENCY.CRITICAL,
    );

    this.createServiceIntegration(
      sentryVendor,
      pagerDutyNonCritical,
      PAGERDUTY_SERVICE_URGENCY.NON_CRITICAL,
    );

    const cloudwatchCriticalIntegration = this.createServiceIntegration(
      cloudwatchVendor,
      pagerDutyCritical,
      PAGERDUTY_SERVICE_URGENCY.CRITICAL,
    );

    const cloudwatchNonCriticalIntegration = this.createServiceIntegration(
      cloudwatchVendor,
      pagerDutyNonCritical,
      PAGERDUTY_SERVICE_URGENCY.NON_CRITICAL,
    );

    const snsCriticalAlarmTopic = (this.snsCriticalAlarmTopic =
      this.createSnsTopic(PAGERDUTY_SERVICE_URGENCY.CRITICAL));

    const snsNonCriticalAlarmTopic = (this.snsNonCriticalAlarmTopic =
      this.createSnsTopic(PAGERDUTY_SERVICE_URGENCY.NON_CRITICAL));

    this.createSnsTopicSubscription(
      snsCriticalAlarmTopic,
      cloudwatchCriticalIntegration,
      PAGERDUTY_SERVICE_URGENCY.CRITICAL,
    );

    this.createSnsTopicSubscription(
      snsNonCriticalAlarmTopic,
      cloudwatchNonCriticalIntegration,
      PAGERDUTY_SERVICE_URGENCY.NON_CRITICAL,
    );
  }

  private createSnsTopicSubscription(
    topic: snsTopic.SnsTopic,
    integration: serviceIntegration.ServiceIntegration,
    urgency: PAGERDUTY_SERVICE_URGENCY,
  ): snsTopicSubscription.SnsTopicSubscription {
    return new snsTopicSubscription.SnsTopicSubscription(
      this,
      `alarm-${urgency.toLowerCase()}-subscription`,
      {
        topicArn: topic.arn,
        protocol: 'https',
        endpoint: `https://events.pagerduty.com/integration/${integration.integrationKey}/enqueue`,
        endpointAutoConfirms: true,
        confirmationTimeoutInMinutes:
          this.config.sns?.subscription?.confirmationTimeoutInMinutes ??
          PocketPagerDuty.SNS_SUBSCRIPTION_CONFIRMATION_TIMEOUT_IN_MINUTES,
        dependsOn: [topic, integration],
        provider: this.config.provider,
      },
    );
  }

  private createSnsTopic(
    urgency: PAGERDUTY_SERVICE_URGENCY,
  ): snsTopic.SnsTopic {
    return new snsTopic.SnsTopic(this, `alarm-${urgency.toLowerCase()}-topic`, {
      name: `${this.config.prefix}-Infrastructure-Alarm-${urgency}`,
      tags: this.config.sns?.topic?.tags ?? {},
      provider: this.config.provider,
    });
  }

  private createServiceIntegration(
    vendor: dataPagerdutyVendor.DataPagerdutyVendor,
    service: service.Service,
    urgency: PAGERDUTY_SERVICE_URGENCY,
  ): serviceIntegration.ServiceIntegration {
    return new serviceIntegration.ServiceIntegration(
      this,
      `${vendor.friendlyUniqueId}-${urgency.toLowerCase()}`,
      {
        name: vendor.name,
        service: service.id,
        vendor: vendor.id,
        dependsOn: [service],
      },
    );
  }

  private createService(urgency: PAGERDUTY_SERVICE_URGENCY): service.Service {
    const serviceConfig = this.config.service;

    return new service.Service(this, `pagerduty-${urgency.toLowerCase()}`, {
      name: `${this.config.prefix}-PagerDuty-${urgency}`,
      acknowledgementTimeout:
        serviceConfig.acknowledgementTimeout?.toString() ??
        PocketPagerDuty.SERVICE_ACKNOWLEDGEMENT_TIMEOUT,
      alertCreation: 'create_incidents',
      autoResolveTimeout:
        serviceConfig.autoResolveTimeout?.toString() ??
        PocketPagerDuty.SERVICE_AUTO_RESOLVE_TIMEOUT,
      description: `PagerDuty ${urgency}`,
      escalationPolicy:
        urgency === PAGERDUTY_SERVICE_URGENCY.CRITICAL
          ? serviceConfig.criticalEscalationPolicyId
          : serviceConfig.nonCriticalEscalationPolicyId,
      incidentUrgencyRule: {
        type: 'constant',
        urgency:
          urgency === PAGERDUTY_SERVICE_URGENCY.CRITICAL ? 'high' : 'low',
      },
    });
  }

  private getVendor(name: string): dataPagerdutyVendor.DataPagerdutyVendor {
    return new dataPagerdutyVendor.DataPagerdutyVendor(
      this,
      name.toLowerCase(),
      {
        name,
      },
    );
  }
}

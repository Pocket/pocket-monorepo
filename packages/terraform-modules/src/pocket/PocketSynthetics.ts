import {
  nrqlAlertCondition,
  syntheticsMonitor,
} from '@cdktf/provider-newrelic';
import { Construct } from 'constructs';

export interface PocketSyntheticProps {
  uri: string;
  verifySsl: boolean;
  policyId?: number;
  nrqlConfig?: {
    query?: string;
    evaluationOffset?: number;
    violationTimeLimitSeconds?: number;
    closeViolationsOnExpiration?: boolean;
    expirationDuration?: number;
    slideBy: number;
    aggregationWindow: number;
    aggregationMethod: string;
    aggregationDelay: string;
    critical?: {
      operator?: string;
      threshold?: number;
      thresholdDuration?: number;
      thresholdOccurrences?: string;
    };
  };
}

const globalCheckLocations = [
  'AWS_US_WEST_2',
  'AWS_EU_WEST_2',
  'AWS_US_EAST_2',
];

export class PocketSyntheticCheck extends Construct {
  constructor(
    scope: Construct,
    private name: string,
    private config: PocketSyntheticProps,
  ) {
    super(scope, name);

    // if policy id not provided use default policy id
    // policy in another
    if (this.config.policyId === undefined) {
      // I wanted to do a terraform lookup but it doesn't run before generating
      // the cdktf.json file so we have to hardcode the default policy id
      this.config.policyId = 1707149; // Pocket-Default-Policy
    }

    const pocketMonitor = new syntheticsMonitor.SyntheticsMonitor(
      this,
      `${this.name}-synthetics-monitor`,
      {
        name: `${this.name}-synthetics`,
        type: 'SIMPLE',
        period: 'EVERY_5_MINUTES',
        status: 'ENABLED',
        locationsPublic: globalCheckLocations,
        uri: this.config.uri,
        verifySsl: this.config.verifySsl,
      },
    );

    const defaultNrqlConfig = {
      query: `SELECT count(result) from SyntheticCheck where result = 'FAILED' and monitorName = '${pocketMonitor.name}'`,
      aggregationMethod: 'cadence',
      aggregationWindow: 3000,
      aggregationDelay: '180',
      slideBy: 60,
      violationTimeLimitSeconds: 2592000,
      closeViolationsOnExpiration: true,
      expirationDuration: 600,
      critical: {
        operator: 'above',
        threshold: 2,
        thresholdDuration: 900,
        thresholdOccurrences: 'AT_LEAST_ONCE',
      },
    };

    this.config.nrqlConfig = {
      ...defaultNrqlConfig,
      ...config.nrqlConfig,
    };

    new nrqlAlertCondition.NrqlAlertCondition(this, 'alert-condition', {
      name: `${this.name}-nrql`,
      policyId: this.config.policyId,
      fillValue: 0,
      fillOption: 'static',
      aggregationWindow: this.config.nrqlConfig.aggregationWindow,
      aggregationMethod: this.config.nrqlConfig.aggregationMethod,
      aggregationDelay: this.config.nrqlConfig.aggregationDelay,
      slideBy: this.config.nrqlConfig.slideBy,
      nrql: {
        query: this.config.nrqlConfig.query,
      },
      violationTimeLimitSeconds:
        this.config.nrqlConfig.violationTimeLimitSeconds,
      closeViolationsOnExpiration:
        this.config.nrqlConfig.closeViolationsOnExpiration,
      expirationDuration: this.config.nrqlConfig.expirationDuration,
      critical: {
        operator: this.config.nrqlConfig.critical.operator,
        threshold: this.config.nrqlConfig.critical.threshold,
        thresholdDuration: this.config.nrqlConfig.critical.thresholdDuration,
        thresholdOccurrences:
          this.config.nrqlConfig.critical.thresholdOccurrences,
      },
    });
  }
}

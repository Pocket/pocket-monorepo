import {
  nrqlAlertCondition,
  syntheticsMonitor,
} from '@cdktf/provider-newrelic';
import { Construct } from 'constructs';

interface NRQLConfig {
  query: string;
  evaluationOffset: number;
  violationTimeLimitSeconds: number;
  closeViolationsOnExpiration: boolean;
  expirationDuration: number;
  slideBy: number;
  aggregationWindow: number;
  aggregationMethod: string;
  aggregationDelay: string;
  critical: {
    operator: string;
    threshold: number;
    thresholdDuration: number;
    thresholdOccurrences: string;
  };
}

export interface PocketSyntheticProps {
  uri: string;
  verifySsl: boolean;
  policyId?: number;
  nrqlConfig?: Partial<NRQLConfig>;
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

    const nrqlConfig = {
      ...defaultNrqlConfig,
      ...config.nrqlConfig,
    } as NRQLConfig;

    this.config.nrqlConfig = nrqlConfig;

    new nrqlAlertCondition.NrqlAlertCondition(this, 'alert-condition', {
      name: `${this.name}-nrql`,
      policyId: this.config.policyId,
      fillValue: 0,
      fillOption: 'static',
      aggregationWindow: nrqlConfig.aggregationWindow,
      aggregationMethod: nrqlConfig.aggregationMethod,
      aggregationDelay: nrqlConfig.aggregationDelay,
      slideBy: nrqlConfig.slideBy,
      nrql: {
        query: nrqlConfig.query,
      },
      violationTimeLimitSeconds:
        this.config.nrqlConfig.violationTimeLimitSeconds,
      closeViolationsOnExpiration:
        this.config.nrqlConfig.closeViolationsOnExpiration,
      expirationDuration: this.config.nrqlConfig.expirationDuration,
      critical: {
        operator: nrqlConfig.critical.operator,
        threshold: nrqlConfig.critical.threshold,
        thresholdDuration: nrqlConfig.critical.thresholdDuration,
        thresholdOccurrences: nrqlConfig.critical.thresholdOccurrences,
      },
    });
  }
}

import { Construct } from 'constructs';
import { TerraformMetaArguments } from 'cdktf';
import {
  backupPlan,
  backupVault,
  backupVaultPolicy,
  backupSelection,
} from '@cdktf/provider-aws';

export interface ApplicationBackupProps extends TerraformMetaArguments {
  name: string;
  kmsKeyArn: string;
  prefix: string;
  accountId: string;
  vaultPolicy: string;
  backupPlans: {
    name: string;
    resources: string[];
    rules: Omit<backupPlan.BackupPlanRule, 'targetVaultName'>[];
    selectionTag: backupSelection.BackupSelectionSelectionTag[];
  }[];
  tags?: { [key: string]: string };
}

export class ApplicationBackup extends Construct {
  public backupPlan: backupPlan.BackupPlan;
  public backupSelection: backupSelection.BackupSelection;
  public backupPlanRule: backupPlan.BackupPlanRule;
  private static vault: backupVault.BackupVault;

  constructor(
    scope: Construct,
    name: string,
    private config: ApplicationBackupProps,
  ) {
    super(scope, name);

    const vault = new backupVault.BackupVault(this, 'backup-vault', {
      name: `${config.prefix}-${config.name}`,
      kmsKeyArn: config.kmsKeyArn,
      tags: config.tags,
      provider: config.provider,
    });

    new backupVaultPolicy.BackupVaultPolicy(this, 'backup-vault-policy', {
      backupVaultName: vault.name,
      policy: config.vaultPolicy,
      provider: config.provider,
    });

    config.backupPlans.forEach((plan) => {
      const backupPlanResource = new backupPlan.BackupPlan(
        this,
        'backup-plan',
        {
          name: plan.name,
          rule: plan.rules.map((rule) => ({
            ...rule,
            targetVaultName: vault.name,
          })),
          tags: config.tags,
          provider: config.provider,
        },
      );

      new backupSelection.BackupSelection(this, 'backup-selection', {
        name: `${config.prefix}-Backup-Selection`,
        planId: backupPlanResource.id,
        iamRoleArn: `arn:aws:iam::${config.accountId}:role/service-role/AWSBackupDefaultServiceRole`,
        resources: plan.resources,
        selectionTag: plan.selectionTag,
        provider: config.provider,
      });
    });
  }
}

import { Construct } from 'constructs';
import { TerraformMetaArguments } from 'cdktf';
import {
  BackupPlanRule,
  BackupPlan,
} from '@cdktf/provider-aws/lib/backup-plan';
import {
  BackupSelection,
  BackupSelectionSelectionTag,
} from '@cdktf/provider-aws/lib/backup-selection';
import { BackupVault } from '@cdktf/provider-aws/lib/backup-vault';
import { BackupVaultPolicy } from '@cdktf/provider-aws/lib/backup-vault-policy';

export interface ApplicationBackupProps extends TerraformMetaArguments {
  name: string;
  kmsKeyArn: string;
  prefix: string;
  accountId: string;
  vaultPolicy: string;
  backupPlans: {
    name: string;
    resources: string[];
    rules: Omit<BackupPlanRule, 'targetVaultName'>[];
    selectionTag: BackupSelectionSelectionTag[];
  }[];
  tags?: { [key: string]: string };
}

export class ApplicationBackup extends Construct {
  public backupPlan: BackupPlan;
  public backupSelection: BackupSelection;
  public backupPlanRule: BackupPlanRule;
  private static vault: BackupVault;

  constructor(
    scope: Construct,
    name: string,
    private config: ApplicationBackupProps,
  ) {
    super(scope, name);

    const vault = new BackupVault(this, 'backup-vault', {
      name: `${config.prefix}-${config.name}`,
      kmsKeyArn: config.kmsKeyArn,
      tags: config.tags,
      provider: config.provider,
    });

    new BackupVaultPolicy(this, 'backup-vault-policy', {
      backupVaultName: vault.name,
      policy: config.vaultPolicy,
      provider: config.provider,
    });

    config.backupPlans.forEach((plan) => {
      const backupPlan = new BackupPlan(this, 'backup-plan', {
        name: plan.name,
        rule: plan.rules.map((rule) => ({
          ...rule,
          targetVaultName: vault.name,
        })),
        tags: config.tags,
        provider: config.provider,
      });

      new BackupSelection(this, 'backup-selection', {
        name: `${config.prefix}-Backup-Selection`,
        planId: backupPlan.id,
        iamRoleArn: `arn:aws:iam::${config.accountId}:role/service-role/AWSBackupDefaultServiceRole`,
        resources: plan.resources,
        selectionTag: plan.selectionTag,
        provider: config.provider,
      });
    });
  }
}

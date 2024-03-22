import { Testing } from 'cdktf';
import { ApplicationBackup } from './ApplicationBackups.js'

describe('ApplicationBackup', () => {
  it('renders vault with plans without tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationBackup(stack, 'testBackup', {
        name: 'name',
        kmsKeyArn: 'arn:aws:kms:us-east-1:1234567890:key/mrk-1234',
        prefix: 'prefix',
        accountId: '1234567890',
        vaultPolicy:
          '{"Version": "2012-10-17","Statement": [{"Effect": "Allow","Action": "backup:CopyIntoBackupVault","Resource": "*","Principal": "*","Condition": {"StringEquals": {"aws:PrincipalOrgID": ["o-1234567890"]}}}]}',
        backupPlans: [
          {
            name: 'TestPlan',
            resources: ['arn:aws:rds:us-east-1:123456790:db:test'],
            rules: [
              {
                ruleName: 'TestBackupRule',
                schedule: 'cron( 0 5 ? * * *)',
              },
            ],
            selectionTag: [
              {
                key: 'backups',
                type: 'STRINGEQUALS',
                value: 'True',
              },
            ],
          },
        ],
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders vault with plans with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationBackup(stack, 'testBackup', {
        name: 'name',
        kmsKeyArn: 'arn:aws:kms:us-east-1:1234567890:key/mrk-1234',
        prefix: 'prefix',
        accountId: '1234567890',
        vaultPolicy:
          '{"Version": "2012-10-17","Statement": [{"Effect": "Allow","Action": "backup:CopyIntoBackupVault","Resource": "*","Principal": "*","Condition": {"StringEquals": {"aws:PrincipalOrgID": ["o-1234567890"]}}}]}',
        backupPlans: [
          {
            name: 'TestPlan',
            resources: ['arn:aws:rds:us-east-1:123456790:db:test'],
            rules: [
              {
                ruleName: 'TestBackupRule',
                schedule: 'cron( 0 5 ? * * *)',
              },
            ],
            selectionTag: [
              {
                key: 'backups',
                type: 'STRINGEQUALS',
                value: 'True',
              },
            ],
          },
        ],
        tags: {
          name: 'thedude',
          hobby: 'bowling',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});

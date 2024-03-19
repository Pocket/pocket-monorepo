import { ecrRepository, ecrLifecyclePolicy } from '@cdktf/provider-aws';
import { TerraformMetaArguments } from 'cdktf';
import { Construct } from 'constructs';

export interface ECRProps extends TerraformMetaArguments {
  name: string;
  tags?: { [key: string]: string };
}

export class ApplicationECR extends Construct {
  public readonly repo: ecrRepository.EcrRepository;

  constructor(scope: Construct, name: string, config: ECRProps) {
    super(scope, name);

    const ecrConfig: ecrRepository.EcrRepositoryConfig = {
      name: config.name,
      tags: config.tags,
      imageScanningConfiguration: {
        scanOnPush: true, // scans docker image for vulnerabilities
      },
      provider: config.provider,
    };

    this.repo = new ecrRepository.EcrRepository(this, 'ecr-repo', ecrConfig);

    // this is our default policy
    // perhaps this should be defined elsewhere? or allow to be overwritten?
    // decisions for another day...
    const policy = {
      rules: [
        {
          rulePriority: 1,
          description: 'expire old images',
          selection: {
            tagStatus: 'any',
            countType: 'imageCountMoreThan',
            countNumber: 800,
          },
          action: {
            type: 'expire',
          },
        },
      ],
    };

    const ecrPolicyConfig: ecrLifecyclePolicy.EcrLifecyclePolicyConfig = {
      repository: this.repo.name,
      policy: JSON.stringify(policy),
      dependsOn: [this.repo],
      provider: config.provider,
    };

    new ecrLifecyclePolicy.EcrLifecyclePolicy(
      this,
      'ecr-repo-lifecyclepolicy',
      ecrPolicyConfig,
    );
  }
}

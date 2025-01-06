import { Testing } from 'cdktf';
import {
  ApplicationVersionedLambda,
  ApplicationVersionedLambdaProps,
  LAMBDA_RUNTIMES,
} from './ApplicationVersionedLambda.ts';

const config: ApplicationVersionedLambdaProps = {
  name: 'Test-Lambda',
  runtime: LAMBDA_RUNTIMES.PYTHON38,
  handler: 'index.handler',
  s3Bucket: 'test-bucket',
};

describe('ApplicationVersionedLambda', () => {
  it('renders a versioned lambda', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', config);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a versioned lambda with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        tags: {
          my: 'tag',
          for: 'test',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a versioned lambda with environment variables', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        environment: {
          MY: 'env_var',
          for: 'test',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a versioned lambda with timeout', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        timeout: 500,
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a versioned lambda with description', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        description: 'Test Description',
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a versioned lambda with execution policy statements', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        executionPolicyStatements: [
          {
            effect: 'Allow',
            actions: ['*'],
            resources: ['*'],
          },
        ],
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a versioned lambda with log retention', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        logRetention: 10,
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a versioned lambda with vpc', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        vpcConfig: {
          subnetIds: ['1', '2'],
          securityGroupIds: ['sec1', 'sec2'],
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a versioned lambda with s3 bucket', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        s3Bucket: 'test-bucket',
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a versioned lambda with publish ignored', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        usesCodeDeploy: true,
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a lambda with a node v14 runtime', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        runtime: LAMBDA_RUNTIMES.NODEJS14,
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a lambda with the secrets layer', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        addParameterStoreAndSecretsLayer: true,
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a lambda with the secrets layer and extra layers', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        addParameterStoreAndSecretsLayer: true,
        layers: ['thebest-layer'],
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a lambda with extra layers', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationVersionedLambda(stack, 'test-versioned-lambda', {
        ...config,
        layers: ['thebest-layer'],
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});

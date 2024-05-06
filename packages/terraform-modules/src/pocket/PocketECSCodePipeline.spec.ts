import { Testing } from 'cdktf';
import {
  PocketECSCodePipeline,
  PocketECSCodePipelineProps,
} from './PocketECSCodePipeline.js';

const config: PocketECSCodePipelineProps = {
  prefix: 'Test-Env',
  source: {
    repository: 'string',
    branchName: 'test',
    codeStarConnectionArn: 'arn:codestart-connection:*',
  },
};

test('renders a Pocket ECS Codepipeline template', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketECSCodePipeline(stack, 'test-codepipeline', config);
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket ECS Codepipeline template with tags', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketECSCodePipeline(stack, 'test-codepipeline', {
      ...config,
      tags: { yup: 'a tag' },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket ECS Codepipeline template with the provided code build project name', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketECSCodePipeline(stack, 'test-codepipeline', {
      ...config,
      codeBuildProjectName: 'TestBuildName',
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket ECS Codepipeline template with the provided CodeDeploy app name', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketECSCodePipeline(stack, 'test-codepipeline', {
      ...config,
      codeDeploy: {
        applicationName: 'TestAppName',
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket ECS Codepipeline template with the provided CodeDeploy deployment group name', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketECSCodePipeline(stack, 'test-codepipeline', {
      ...config,
      codeDeploy: {
        deploymentGroupName: 'TestDeploymentGroupName',
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket ECS Codepipeline template with the provided artifact bucket prefix', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketECSCodePipeline(stack, 'test-codepipeline', {
      ...config,
      artifactBucketPrefix: 'my-codepipeline',
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket ECS Codepipeline template with the provided appspec path', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketECSCodePipeline(stack, 'test-codepipeline', {
      ...config,
      codeDeploy: {
        appSpecPath: 'testappspec.json',
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket ECS Codepipeline template with the provided taskdef path', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketECSCodePipeline(stack, 'test-codepipeline', {
      ...config,
      codeDeploy: {
        taskDefPath: 'testtaskdef.json',
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket ECS Codepipeline template with custom steps', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketECSCodePipeline(stack, 'test-codepipeline', {
      ...config,
      preDeployStages: [
        {
          name: 'Custom_PreDeploy_Stage',
          action: [
            {
              name: 'MyBuild',
              category: 'Deploy',
              owner: 'AWS',
              provider: 'CodeBuild',
              version: '1',
              configuration: {
                projectName: 'Test-Env-MyBuild',
              },
              runOrder: 1,
            },
          ],
        },
      ],
      postDeployStages: [
        {
          name: 'Custom_PostDeploy_Stage',
          action: [
            {
              name: 'Custom_Action',
              category: 'Deploy',
              owner: 'AWS',
              provider: 'StepFunctions',
              version: '1',
              configuration: {
                stateMachineArn: 'myStateMachineArn123',
                ExecutionNamePrefix: 'CodePipelineDeploy',
              },
              runOrder: 1,
            },
          ],
        },
      ],
    });
  });
  expect(synthed).toMatchSnapshot();
});

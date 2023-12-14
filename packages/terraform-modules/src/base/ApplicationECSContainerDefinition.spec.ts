import { expect } from 'chai';
import {
  ApplicationECSContainerDefinitionProps,
  buildDefinitionJSON,
} from './ApplicationECSContainerDefinition';

describe('ApplicationECSContainerDefinition', () => {
  describe('buildDefinitionJSON', () => {
    let config: ApplicationECSContainerDefinitionProps;

    beforeEach(() => {
      config = {
        containerImage: 'testImage',
        logGroup: 'bowlingGroup',
        logMultilinePattern: '^\\S.+',
        logDatetimeFormat: '[%b %d, %Y %H:%M:%S]',
        portMappings: [
          {
            hostPort: 3000,
            containerPort: 4000,
          },
        ],
        ulimits: [
          {
            name: 'nproc',
            softLimit: 2048,
            hardLimit: 2048,
          },
          {
            name: 'nofile',
            softLimit: 65535,
            hardLimit: 65535,
          },
        ],
        name: 'lebowski',
        repositoryCredentialsParam: 'someArn',
      };
    });

    it('builds JSON without env vars', () => {
      const result = buildDefinitionJSON(config);

      expect(result).to.contain('"awslogs-group":"bowlingGroup"');
      expect(result).to.contain('"awslogs-multiline-pattern":"^\\\\S.+"');
      expect(result).to.contain(
        '"awslogs-datetime-format":"[%b %d, %Y %H:%M:%S]"',
      );
      expect(result).to.contain('"hostPort":3000');
      expect(result).to.contain('"containerPort":4000');
      expect(result).to.contain('"image":"testImage"');
      expect(result).to.contain('"name":"lebowski"');
      expect(result).to.contain('"credentialsParameter":"someArn"');
      expect(result).to.contain('"environment":[]');
      expect(result).to.contain('"secrets":null');
      expect(result).to.contain('"softLimit":2048');
      expect(result).to.contain('"hardLimit":65535');
      expect(result).not.to.contain('"command":');
    });

    it('builds JSON with env vars', () => {
      config.envVars = [
        {
          name: 'dude',
          value: 'abides',
        },
        {
          name: 'letsgo',
          value: 'bowling',
        },
      ];

      const result = buildDefinitionJSON(config);

      expect(result).to.contain(
        `"environment":${JSON.stringify(config.envVars)}`,
      );
    });

    it('builds JSON with secret env vars', () => {
      config.secretEnvVars = [
        {
          name: 'dude',
          valueFrom: 'abides',
        },
        {
          name: 'letsgo',
          valueFrom: 'bowling',
        },
      ];

      const result = buildDefinitionJSON(config);

      expect(result).to.contain(
        `"secrets":${JSON.stringify(config.secretEnvVars)}`,
      );
    });

    it('builds JSON with a command', () => {
      config.command = ['go to in-n-out', 'go bowling'];

      const result = buildDefinitionJSON(config);

      expect(result).to.contain(`"command":["go to in-n-out","go bowling"]`);
    });

    it('builds JSON with a healthcheck', () => {
      config.healthCheck = {
        command: [
          'CMD-SHELL',
          'curl -f "http://127.0.0.1:8000/pulse" || exit 1',
        ],
        interval: 30,
        retries: 2,
        startPeriod: 0,
        timeout: 5,
      };

      const result = buildDefinitionJSON(config);

      expect(result).to.contain(
        `"healthCheck":{` +
          `"command":["CMD-SHELL","curl -f \\"http://127.0.0.1:8000/pulse\\" || exit 1"],` +
          `"interval":30,` +
          `"retries":2,` +
          `"startPeriod":0,` +
          `"timeout":5}`,
      );
    });

    it('builds JSON without repository credentials', () => {
      config.repositoryCredentialsParam = undefined;

      const result = buildDefinitionJSON(config);

      expect(result).to.contain(`"repositoryCredentials":null,`);
    });

    it('builds JSON with mountPoints', () => {
      config.mountPoints = [
        {
          containerPath: '/"-".txt',
          readOnly: true,
          sourceVolume: '/[{}].txt',
        },
      ];

      const result = buildDefinitionJSON(config);

      expect(result).to.contain(
        `"mountPoints":[{` +
          `"containerPath":"/\\"-\\".txt",` +
          `"readOnly":true,` +
          `"sourceVolume":"/[{}].txt"}`,
      );
    });

    it('passes entryPoint', () => {
      config.entryPoint = ['/bin/bash'];

      const result = buildDefinitionJSON(config);

      expect(result).to.contain(`"entryPoint":["/bin/bash"]`);
    });

    it('passes essential', () => {
      config.essential = false;

      const result = buildDefinitionJSON(config);

      expect(result).to.contain(`"essential":false`);
    });

    it('essential defaults to true', () => {
      const result = buildDefinitionJSON(config);

      expect(result).to.contain(`"essential":true`);
    });
  });
});

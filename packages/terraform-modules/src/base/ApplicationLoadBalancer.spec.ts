import { Testing } from 'cdktf';
import { ApplicationLoadBalancer } from './ApplicationLoadBalancer.ts';

describe('ApplicationLoadBalancer', () => {
  it('renders an ALB without tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLoadBalancer(stack, 'testALB', {
        prefix: 'test-',
        alb6CharacterPrefix: 'TEST',
        vpcId: '123',
        subnetIds: ['a', 'b'],
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ALB with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLoadBalancer(stack, 'testALB', {
        prefix: 'test-',
        alb6CharacterPrefix: 'TEST',
        vpcId: '123',
        subnetIds: ['a', 'b'],
        tags: {
          name: 'thedude',
          hobby: 'bowling',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ALB with logs with a new bucket', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLoadBalancer(stack, 'testALB', {
        prefix: 'test-',
        alb6CharacterPrefix: 'TEST',
        vpcId: '123',
        subnetIds: ['a', 'b'],
        tags: {
          name: 'thedude',
          hobby: 'bowling',
        },
        accessLogs: {
          bucket: 'logging-bucket',
        },
        connectionLogs: {
          bucket: 'connection-logging-bucket',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ALB with logs with a new bucket and prefix', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLoadBalancer(stack, 'testALB', {
        prefix: 'test-',
        alb6CharacterPrefix: 'TEST',
        vpcId: '123',
        subnetIds: ['a', 'b'],
        tags: {
          name: 'thedude',
          hobby: 'bowling',
        },
        accessLogs: {
          bucket: 'logging-bucket',
          prefix: 'logs/ahoy/cool/service',
        },
        connectionLogs: {
          bucket: 'connection-logging-bucket',
          prefix: 'logs/ahoy/cool/service',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ALB with logs with an existing bucket', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLoadBalancer(stack, 'testALB', {
        prefix: 'test-',
        alb6CharacterPrefix: 'TEST',
        vpcId: '123',
        subnetIds: ['a', 'b'],
        tags: {
          name: 'thedude',
          hobby: 'bowling',
        },
        accessLogs: {
          existingBucket: 'logging-bucket',
        },
        connectionLogs: {
          existingBucket: 'connection-logging-bucket',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ALB with logs with an existing bucket and prefix', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLoadBalancer(stack, 'testALB', {
        prefix: 'test-',
        alb6CharacterPrefix: 'TEST',
        vpcId: '123',
        subnetIds: ['a', 'b'],
        tags: {
          name: 'thedude',
          hobby: 'bowling',
        },
        accessLogs: {
          existingBucket: 'logging-bucket',
          prefix: 'logs/ahoy/cool/service',
        },
        connectionLogs: {
          existingBucket: 'connection-logging-bucket',
          prefix: 'logs/ahoy/cool/service',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('errors when no bucket provided for access logs', () => {
    expect(() => {
      Testing.synthScope((stack) => {
        new ApplicationLoadBalancer(stack, 'testALB', {
          prefix: 'test-',
          alb6CharacterPrefix: 'TEST',
          vpcId: '123',
          subnetIds: ['a', 'b'],
          tags: {
            name: 'thedude',
            hobby: 'bowling',
          },
          accessLogs: {
            prefix: 'logs/ahoy/cool/service',
          },
        });
      });
    }).toThrow(
      'If you are configuring access or connection logs you need to define either an existing bucket or a new one to store the logs',
    );
  });

  it('errors when no bucket provided for connection logs', () => {
    expect(() => {
      Testing.synthScope((stack) => {
        new ApplicationLoadBalancer(stack, 'testALB', {
          prefix: 'test-',
          alb6CharacterPrefix: 'TEST',
          vpcId: '123',
          subnetIds: ['a', 'b'],
          tags: {
            name: 'thedude',
            hobby: 'bowling',
          },
          connectionLogs: {
            prefix: 'logs/ahoy/cool/service',
          },
        });
      });
    }).toThrow(
      'If you are configuring access or connection logs you need to define either an existing bucket or a new one to store the logs',
    );
  });
});

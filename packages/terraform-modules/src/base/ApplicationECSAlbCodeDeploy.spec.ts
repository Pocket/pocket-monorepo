import { Testing } from 'cdktf';
import { ApplicationECSAlbCodeDeploy } from './ApplicationECSAlbCodeDeploy.js';

describe('ApplicationECSAlbCodeDeploy', () => {
  it('renders a CodeDeploy without a sns', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSAlbCodeDeploy(stack, 'testCodeDeploy', {
        prefix: 'Test-Dev',
        clusterName: 'cluster',
        serviceName: 'theService',
        listenerArn: 'listen-to-me',
        targetGroupNames: ['target-1', 'target-2'],
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a CodeDeploy with a sns', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSAlbCodeDeploy(stack, 'testCodeDeploy', {
        prefix: 'Test-Dev',
        clusterName: 'cluster',
        serviceName: 'theService',
        listenerArn: 'listen-to-me',
        snsNotificationTopicArn: 'notify-me',
        targetGroupNames: ['target-1', 'target-2'],
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a CodeDeploy with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSAlbCodeDeploy(stack, 'testCodeDeploy', {
        prefix: 'Test-Dev',
        clusterName: 'cluster',
        serviceName: 'theService',
        listenerArn: 'listen-to-me',
        snsNotificationTopicArn: 'notify-me',
        targetGroupNames: ['target-1', 'target-2'],
        tags: {
          test: '1234',
          tag: 'me',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a CodeDeploy with only failed deploy notifications', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSAlbCodeDeploy(stack, 'testCodeDeploy', {
        prefix: 'Test-Dev',
        clusterName: 'cluster',
        serviceName: 'theService',
        listenerArn: 'listen-to-me',
        snsNotificationTopicArn: 'notify-me',
        targetGroupNames: ['target-1', 'target-2'],
        tags: {
          test: '1234',
          tag: 'me',
        },
        notifications: {
          notifyOnFailed: true,
          notifyOnStarted: false,
          notifyOnSucceeded: false,
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a CodeDeploy with only succeeded deploy notifications', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSAlbCodeDeploy(stack, 'testCodeDeploy', {
        prefix: 'Test-Dev',
        clusterName: 'cluster',
        serviceName: 'theService',
        listenerArn: 'listen-to-me',
        snsNotificationTopicArn: 'notify-me',
        targetGroupNames: ['target-1', 'target-2'],
        tags: {
          test: '1234',
          tag: 'me',
        },
        notifications: {
          notifyOnFailed: false,
          notifyOnStarted: false,
          notifyOnSucceeded: true,
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a CodeDeploy with only started deploy notifications', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSAlbCodeDeploy(stack, 'testCodeDeploy', {
        prefix: 'Test-Dev',
        clusterName: 'cluster',
        serviceName: 'theService',
        listenerArn: 'listen-to-me',
        snsNotificationTopicArn: 'notify-me',
        targetGroupNames: ['target-1', 'target-2'],
        tags: {
          test: '1234',
          tag: 'me',
        },
        notifications: {
          notifyOnFailed: false,
          notifyOnStarted: true,
          notifyOnSucceeded: false,
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a CodeDeploy with no deploy notifications', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSAlbCodeDeploy(stack, 'testCodeDeploy', {
        prefix: 'Test-Dev',
        clusterName: 'cluster',
        serviceName: 'theService',
        listenerArn: 'listen-to-me',
        snsNotificationTopicArn: 'notify-me',
        targetGroupNames: ['target-1', 'target-2'],
        tags: {
          test: '1234',
          tag: 'me',
        },
        notifications: {
          notifyOnFailed: false,
          notifyOnStarted: false,
          notifyOnSucceeded: false,
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});

import { Testing } from 'cdktf';
import { TestResource } from '../testHelpers';
import { ApplicationBaseDNS } from './ApplicationBaseDNS';

describe('ApplicationBaseDNS', () => {
  const tags = {
    name: 'thedude',
    hobby: 'bowling',
  };

  describe('retrieveAwsRoute53Zone', () => {
    it('retrieves a route 53 zone', () => {
      const synthed = Testing.synthScope((stack) => {
        ApplicationBaseDNS.retrieveAwsRoute53Zone(
          new TestResource(stack, 'test-resource'),
          'some-zone',
          'dev.gobowling.info',
        );
      });
      expect(synthed).toMatchSnapshot();
    });
  });

  describe('generateRoute53Zone', () => {
    it('renders a route 53 zone', () => {
      const synthed = Testing.synthScope((stack) => {
        ApplicationBaseDNS.generateRoute53Zone(
          new TestResource(stack, 'test-resource'),
          'dev.gobowling.info',
        );
      });
      expect(synthed).toMatchSnapshot();
    });

    it('renders a route 53 zone with tags', () => {
      const synthed = Testing.synthScope((stack) => {
        ApplicationBaseDNS.generateRoute53Zone(
          new TestResource(stack, 'test-resource'),
          'dev.gobowling.info',
          tags,
        );
      });
      expect(synthed).toMatchSnapshot();
    });
  });

  describe('generateRoute53Record', () => {
    it('renders a route 53 record', () => {
      const synthed = Testing.synthScope((stack) => {
        ApplicationBaseDNS.generateRoute53Record(
          new TestResource(stack, 'test-resource'),
          'dev.gobowling.info',
          'some-zone-id',
          ['some', 'records'],
        );
      });
      expect(synthed).toMatchSnapshot();
    });
  });

  describe('constructor', () => {
    it('renders base DNS without tags', () => {
      const synthed = Testing.synthScope((stack) => {
        new ApplicationBaseDNS(stack, 'testDNS', {
          domain: 'dev.gobowling.info',
        });
      });
      expect(synthed).toMatchSnapshot();
    });

    it('renders base DNS with tags', () => {
      const synthed = Testing.synthScope((stack) => {
        new ApplicationBaseDNS(stack, 'testDNS', {
          domain: 'dev.gobowling.info',
          tags: tags,
        });
      });
      expect(synthed).toMatchSnapshot();
    });
  });
});

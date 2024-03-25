import { Testing, TerraformStack } from 'cdktf';
import { TestResource } from '../testHelpers.js';
import { ApplicationCertificate } from './ApplicationCertificate.js';

describe('ApplicationCertificate', () => {
  const tags = {
    name: 'thedude',
    hobby: 'bowling',
  };

  describe('generateAcmCertificate', () => {
    it('renders an acm certificate without tags', () => {
      const synthed = Testing.synthScope((stack) => {
        ApplicationCertificate.generateAcmCertificate(
          new TestResource(stack, 'test-resource'),
          'dev.gobowling.info',
        );
      });
      expect(synthed).toMatchSnapshot();
    });

    it('renders an acm certificate with tags', () => {
      const synthed = Testing.synthScope((stack) => {
        ApplicationCertificate.generateAcmCertificate(
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
        const construct = new TestResource(stack, 'test-resource');

        const cert = ApplicationCertificate.generateAcmCertificate(
          construct,
          'dev.gobowling.info',
        );

        ApplicationCertificate.generateRoute53Record(
          construct,
          'dev.gobowling.info',
          cert,
        );
      });
      expect(synthed).toMatchSnapshot();
    });
  });

  describe('generateAcmCertificateValidation', () => {
    it('renders an acm certificate validation', () => {
      const synthed = Testing.synthScope((stack) => {
        const construct = new TestResource(stack, 'test-resource');

        const cert = ApplicationCertificate.generateAcmCertificate(
          construct,
          'dev.gobowling.info',
        );

        const record = ApplicationCertificate.generateRoute53Record(
          construct,
          'dev.gobowling.info',
          cert,
        );

        ApplicationCertificate.generateAcmCertificateValidation(
          construct,
          cert,
          record,
        );
      });
      expect(synthed).toMatchSnapshot();
    });
  });

  describe('constructor', () => {
    it('throws an error without a zone id or zone domain', () => {
      const app = Testing.app();
      const stack = new TerraformStack(app, 'test');

      expect(() => {
        new ApplicationCertificate(stack, 'testCert', {
          domain: 'dev.gobowling.info',
        });
      }).toThrow('You need to pass either a zone id or a zone domain');
    });

    it('renders a cert with a zone id', () => {
      const synthed = Testing.synthScope((stack) => {
        new ApplicationCertificate(stack, 'testCert', {
          domain: 'dev.gobowling.info',
          zoneId: 'malibu',
        });
      });
      expect(synthed).toMatchSnapshot();
    });

    it('renders a cert with a zone domain', () => {
      const synthed = Testing.synthScope((stack) => {
        new ApplicationCertificate(stack, 'testCert', {
          domain: 'dev.gobowling.info',
          zoneId: 'gobowling.info',
        });
      });
      expect(synthed).toMatchSnapshot();
    });

    it('renders a cert with tags', () => {
      const synthed = Testing.synthScope((stack) => {
        new ApplicationCertificate(stack, 'testCert', {
          domain: 'dev.gobowling.info',
          zoneId: 'gobowling.info',
          tags: {
            name: 'thedude',
            hobby: 'bowling',
          },
        });
      });
      expect(synthed).toMatchSnapshot();
    });
  });
});

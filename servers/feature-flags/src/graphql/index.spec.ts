import { buildContext } from './index';

describe('apollo server', () => {
  describe('does extract express context', () => {
    // This any is really an ExpressContext but we use any to prevent having to fully fill out that object type
    const context: any = {
      req: {
        headers: {
          'x-forwarded-for': '1.2.3.4',
          'accept-language': 'en',
        },
        ip: '5.6.7.8',
      },
    };

    it('extracts appropriate IPs', async () => {
      const subject = await buildContext(context);
      expect(subject.forwardedIp).toBe('1.2.3.4');
      expect(subject.ip).toBe('5.6.7.8');
    });

    it('extracts locale', async () => {
      const subject = await buildContext(context);
      expect(subject.locale).toBe('en');
    });
  });
});

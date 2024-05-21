const name = 'Braze';
const transactionalDomainPrefix = 'team';
const marketingDomainPrefix = 'go';
const newsletterDomainPrefix = 'today';
const clickTrackingDomainPrefix = 'clicks';

const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';

const brazeAccountId = isDev ? '716373062512' : '716373062512';
const brazeExternalId = isDev
  ? 'dc2829bc-e8ff-443e-875a-a82d42f98ffb'
  : '4eb250a2-41d7-4e83-81bb-b628988cea43';
const brazeBucketName = isDev
  ? 'pocket-dev-braze-data-export'
  : 'pocket-prod-braze-data-export';

const rootDomain = isDev ? `getpocket.dev` : `getpocket.com`;

const clickTrackingDomain = `${clickTrackingDomainPrefix}.${rootDomain}`;

const marketingTextRecords = isDev
  ? {}
  : {
      //Braze
      'scph0222._domainkey': [
        'v=DKIM1; k=rsa; h=sha256; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCrs0g02ATgL7DLxF2X12KwgA3BMNI9lmoc7yZadJvr5vLRjJFe0D3Kjqk34dqRuPbpx7B1S1YIrcWHGyXTwnGAtixu80xgTudeEMY+9YaUAJJrN/UXAamEu7NwSz9rOcls7uhviLLMxSukxvPVztVDrKcvcvp4mYtO8KIlKNh3wIDAQAB',
      ],
      '': [
        `google-site-verification=5WwgnslsTceW7w1tRBOdz4_jvOyN5KIkqulIX5jNdiU`, //Google Postmasters
        `v=spf1 redirect=_spf.sparkpostmail.com`, // SPF Record
      ],
    };

const marketingARecords = isDev
  ? {
      //Braze
      qydb: '223.165.124.16',
    }
  : {
      //Braze
      qydb: '223.165.124.16',
    };

const transactionalTextRecords = isDev
  ? {}
  : {
      //Braze
      'scph0222._domainkey': [
        'v=DKIM1; k=rsa; h=sha256; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCm9mCu9YdV+6qR5D5KQmPV1rxy/FTIpE3rlsPY6PQwwWBTmwyKDgDkPGEZWFL4F5BCfJP6gYthdDjcvZdEtrpziS1zQ5rwXywn6z3d+vnPinQUmq78bWNsVc7Xk9df3dapaH3RxmyDOITnUycu/sDkZTeqSC1nM1Le7ju570Y6TQIDAQAB',
      ],
      '': [
        `google-site-verification=NpN2_UDUEi_HIilHqgY0LSh08tSaGg3HwvG3h3RgPHE`, //Google Postmasters
        `v=spf1 redirect=_spf.sparkpostmail.com`, // SPF Record
      ],
    };

const transactionalARecords = isDev
  ? {
      //Braze
      qyyy: '223.165.124.204',
    }
  : {
      //Braze
      qyyy: '223.165.124.204',
    };

const newsletterTextRecords = isDev
  ? {
      //Braze
      'scph0222._domainkey': [
        'v=DKIM1; k=rsa; h=sha256; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQChSimccOTNEW13bh95+16q93w4OarGOh+7SArT5NgEwZmEXsKN9473OCYdMbmjeXkX+mIL7opA8TQetbxFX835Zx3ti35UQoRNWa3N0+zFMR2yJJ23U1qIFGJb/+2Itg9trS1F8OpRP4AOJr3cFNk6os5n35xLaexs9m4tsVbizwIDAQAB',
      ],
      '': [
        `google-site-verification=OvfGRzEBo1cwdsPS5Lfw9vJWlAJt7jB-gQNcd6EzxF4`, //Google Postmasters
        `v=spf1 redirect=_spf.sparkpostmail.com`, // SPF Record
      ],
    }
  : {
      //Braze
      'scph0222._domainkey': [
        'v=DKIM1; k=rsa; h=sha256; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQChSimccOTNEW13bh95+16q93w4OarGOh+7SArT5NgEwZmEXsKN9473OCYdMbmjeXkX+mIL7opA8TQetbxFX835Zx3ti35UQoRNWa3N0+zFMR2yJJ23U1qIFGJb/+2Itg9trS1F8OpRP4AOJr3cFNk6os5n35xLaexs9m4tsVbizwIDAQAB',
      ],
      '': [
        `google-site-verification=OvfGRzEBo1cwdsPS5Lfw9vJWlAJt7jB-gQNcd6EzxF4`, //Google Postmasters
        `v=spf1 redirect=_spf.sparkpostmail.com`, // SPF Record
      ],
    };

const newsletterARecords = isDev
  ? {
      //Braze
      qwtv: '223.165.123.154',
      qv1r: '223.165.122.232',
      qvwm: '223.165.122.182',
    }
  : {
      //Braze
      qwtv: '223.165.123.154',
      qv1r: '223.165.122.232',
      qvwm: '223.165.122.182',
    };

//The domain that the .well-known directory is stored on.
//This holds things like universal link information and our associations with apple & google
const wellKnownStorageDomain = 'getpocket.com';

export const config = {
  name,
  isDev,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'BRAZE',
  environment,
  transactionalDomainPrefix,
  marketingDomainPrefix,
  newsletterDomainPrefix,
  rootDomain,
  wellKnownStorageDomain,
  marketingTextRecords,
  transactionalTextRecords,
  newsletterTextRecords,
  marketingARecords,
  transactionalARecords,
  newsletterARecords,
  clickTrackingDomain,
  brazeAccountId,
  brazeExternalId,
  brazeBucketName,
  tags: {
    service: name,
    environment,
    owner: 'Pocket',
    costCenter: 'Pocket',
    app_code: 'pocket',
    component_code: `pocket-${name.toLowerCase()}`,
    env_code: isDev ? 'dev' : 'prod',
  },
};

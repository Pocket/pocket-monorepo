const log = require('SyntheticsLogger');
const https = require('https');

const ELASTICSEARCH_ENDPOINT =
  'https://vpc-userlistsearch-prod-v2-ee5gxwjmletue32zx64clfmdxu.us-east-1.es.amazonaws.com';

// if a node has less that this value in available disk space, we need to know
const DISK_AVAILABLE_THRESHOLD = 0.15; // i.e. 15%

/**
 * Check the cluster status by making a request to the /_nodes/stats Elasticsearch
 * endpoint and iterating over each node, checking its free disk space
 * @returns {Promise}
 */
const checkClusterStatus = async () => {
  return getClusterStatus()
    .then(inspectClusterStatus)
    .catch((e) => {
      throw e;
    });
};

/**
 * Inspect the JSON returned from Elasticsearch
 * @param nodesStats {JSON object}
 * @returns {Promise}
 */
const inspectClusterStatus = (nodesStats) => {
  const errors = [];

  if (nodesStats._nodes.failed > 0) {
    log.error(`${failed} failing nodes!`);
    errors.push(`${failed} failing nodes!`);
  }

  try {
    for (const [node, stats] of Object.entries(nodesStats.nodes)) {
      const available = stats.fs.total.available_in_bytes;
      const total = stats.fs.total.total_in_bytes;
      const percentAvailable = available / total;

      if (percentAvailable < DISK_AVAILABLE_THRESHOLD) {
        log.error(
          `node ${node} is running out of disk space!`,
          `${available}/${total} (${percentAvailable * 100}% free)`
        );

        errors.push(`node ${node} is running out of disk space!`);
      }
    }
  } catch (e) {
    errors.push(e);
  }

  if (errors.length) {
    throw errors.join(' | ');
  } else {
    log.info('Elasticsearch cluster health is looking good!');
  }
};

/**
 * Get JSON containing node stats for the cluster
 * @returns {Promise}
 */
const getClusterStatus = async () => {
  let dataString = '';

  const response = await new Promise((resolve, reject) => {
    const req = https.get(`${ELASTICSEARCH_ENDPOINT}/_nodes/stats`, (res) => {
      res.on('data', (chunk) => {
        dataString += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(dataString));
      });
    });

    req.on('error', (e) => {
      log.error('Request failed', JSON.stringify(e));
      reject(e);
    });
  });

  return response;
};

const main = async () => {
  await checkClusterStatus();
};

/**
 * The canary handler
 * @returns {Promise<*>}
 */
exports.handler = main;

// to run/test this locally:
// - connect to prod vpn
// - comment out `const log = ...` at the top of this file
// - uncomment code below

//const log = console;
//main();

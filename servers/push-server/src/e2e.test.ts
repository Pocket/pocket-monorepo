
//jest.mock('apn');

test('Receives message from queue and sends it', async () => {
    require('dotenv').config();

    let AWS = require('aws-sdk');

    AWS.config.update({region: 'us-east-1'});

    // Create an SQS service object
    let sqs = new AWS.SQS({apiVersion: '2012-11-05', endpoint: process.env.SQS_ENDPOINT});

    await sqs.sendMessage({
        MessageBody: '{"target":"7","recipient":"prod::5Ql5u42mfZPn6dUyWVGZlDsmEnl\\/QXunIscfuplGd23=","message":"Ping","guid":"ej3ptTf6A1emRLyP6cg671cyDPd7A06d538Af0L526ND7Gp1d1f8bf9aG64DoADT"}', /* required */
        QueueUrl: process.env.JOB_QUEUE_URL, /* required */
    }).promise();

    let worker = require('./worker').worker;
    return await worker.work(1);
});

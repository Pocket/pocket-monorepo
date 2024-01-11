# [SendGridData](https://getpocket.atlassian.net/wiki/spaces/PE/pages/1122009206/SendGrid+Data)

SendGridData is an API Service that delivers events from [SendGrid](https://sendgrid.com/) to AWS SQS, AWS Kinesis Data Firehose and AWS Cloudwatch metrics.

## Service Details (How it works)

`api_gateway -> lambda -> (cloudwatch_metrics | sqs | firehose)`

The API endpoint is setup using AWS API Gateway.

The endpoint is used in a SendGrid account to setup a webhook URL.

When called, API Gateway invokes a lambda function(`src/index.ts`), passing the events (contained in the POST request body) and query parameters (currently only contains the `accountId`)

The lambda function checks the events and delivers them to CloudWatch Metrics, an SQS Queue, and Kinesis Firehose.

### CloudWatch Metrics

Events are delivered to CloudWatch metrics to enable creation of CloudWatch dashboards and alarms to monitor the SendGrid service.

#### Metric Details

- Namespace: `SendGridData-Prod`
- Metric Name: `bounce`, `spamreport`, `processed`, ...
  - see `sendgrid/cloudwatch-metrics.EventType` for supported values
- Dimensions: see `config.aws.cloudwatch.metricDimensions`
  - The dimensions are structured as:
    ```
    eventPropertyKey: MetricDimensionName
    ```

Each event emits 1 or more metric datapoints. Baseline metrics are reported around an action (`bounce`, `unsubscribe`, etc.). Additional metrics can be emitted by adding sets of dimensions.

In general, the event property keys are limited to what the Sendgrid event stream delivers. Additional properties can be attached to the event by passing runtime parameters to `deliver()`. If a value evaluates to `null | undefined`, `none` is used.

> We're currently passing additional parameters through the querystring, which at this time is just `accountId`.

> AWS treats each combination of dimensions as a completely different metric point. For instance, if you want aggregate bounces and aggregate bounces by campaign, you can't simply emit `bounce + {campaignId}` and then only retrieve datapoints for all `bounce` -- you also need to emit `bounce`.

---

### SQS

Events are delivered to an SQS queue and consumed by the [Web Repo](https://github.com/Pocket/Web) to create records on cardinal DB.

---

### Kinesis Data Firehose

Events are delivered to a firehose which creates records on Amazon Redshift and backs up to an S3 bucket.

---

## Data

Event JSON fields with event `type`:

- `ip` (delivered, click, open)
- `response` (delivered, deferred)
- `sg_event_id` (delivered, click, processed, open)
- `message_id` (delivered, click, processed, open)
- `tls` (delivered)
- `event` (delivered, click, processed, open)
- `email` (delivered, click, processed, open)
- `timestamp` (delivered, click, processed, open)
- `smtp-id` (delivered)
- `campaign` (delivered, click, processed, open)
- `useragent` (click, open)
- `url_offset` - json (click)
- `url` (click)

See `post_pocket_example.json`.

## Getting Started

`npm install`

### Testing Locally

```bash
$ npm install # (if you haven't already)
$ npm test
```

### Testing API

```
curl https://<api_id>.execute-api.us-east-1.amazonaws.com/<stage>/events?accountId=<account_id> -d '[
    {
      "ip": "208.117.60.193",
      "response": "250 <PiTW8mnaScijbwBAIYPf0Q@ismtpd0002p1iad1.sendgrid.net> Queued mail for delivery ",
      "sg_event_id": "YKWj0oaiRvipyGE3GH2gjQ",
      "sg_message_id": "PiTW8mnaScijbwBAIYPf0Q.filter0924p1mdw1.4487.57D85A1A41.6",
      "tls": 1,
      "event": "delivered",
      "email": "surabhijoshi1991@outlook.com",
      "timestamp": 1473796636,
      "smtp-id": "<PiTW8mnaScijbwBAIYPf0Q@ismtpd0002p1iad1.sendgrid.net>",
      "campaign": "Pocket Hits Email - start 2016-09-13 - 1473775705"
    }
]'
```

```
curl -XPOST 'https://api.sendgrid.com/v3/mail/send' \
  -H "Authorization: Bearer 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" \
  -H "Content-Type: application/json" \
  -d '{
  "personalizations": [
    {
      "to": [{"email": "jesh@getpocket.com"}],
      "subject": "Hello, World!"
    }
  ],
  "from": {
    "email": "from_address@example.com"
  },
  "content": [
    {
      "type": "text/plain",
      "value": "Hello, World!"
    }
  ]
}'
```

## Cost Breakdown

100 call / min
1440 min / day
30 day / mo

4,320,000 call / mo

### Gateway API

$3.50 per million API calls
4.32 * 3.50 = $15.12

### Lambda

$0.20 per 1 million requests thereafter ($0.0000002 per request)
per call: 4.32 \* $0.2 = $.864
4.32mm calls
200 ms / call average

\$0.000000208 / 100ms @ 128mb

4,320,000 \* 200 / 100 \* $0.000000208 = $1.79712

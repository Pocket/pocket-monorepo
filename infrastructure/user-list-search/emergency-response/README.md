# `pagerduty`

Pulled from [Pocket/terraform-pocket-emergency-response](https://github.com/Pocket/terraform-pocket-emergency-response), which needs to be updated.

A PagerDuty service that’s associated with an escalation policy.

| attribute (req)                   | type   | description                                         |
|-----------------------------------|--------|-----------------------------------------------------|
| `escalation_policy`**req**        | string | a PagerDuty escalation policy                       |
| `auto_resolve_timeout` **req**    | number | seconds until alert is resolved                     |
| `acknowledgement_timeout` **req** | number | seconds until alert is escalated                    |
| `alert_action` **req**            | string | action to take (e.g. `create_incident`)             |
| `rule` **req**                    | map    |                                                     |
| — `type` **req**                  | string | either `constant` (any time) or `use_support_hours` |
| — `urgency` **req**               | string | either `low` (no escalation) or `high` (escalation) |

These are specified as map with each key being an escalation level:

```hcl-terraform
module "emergency" {
    source = "." 
    pagerduty = {
        critical = {
            escalation_policy = "..."
            auto_resolve_timeout = 86400
            acknowledgement_timeout = 600
            alert_action = "create_incident"
            rule = {
                type = "constant"
                urgency = "high"
            }
        }
    }
}
```

## `pagerduty_integrations`

TODO
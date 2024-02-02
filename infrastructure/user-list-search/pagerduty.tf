locals {
  non_critical_alarm_actions = [module.emergency_response.sns_topic_arns["non-critical"]]
}

data "aws_ssm_parameter" "pagerduty_token" {
  name = "/Shared/PAGERDUTY_TOKEN"
}

# retrieve cloudwatch object from pagerduty
data "pagerduty_vendor" "cloudwatch" {
  name = "Cloudwatch"
}

module "emergency_response" {
  source      = "./emergency-response"
  name_prefix = local.prefix
  tags        = local.tags

  pagerduty = {
    critical = {
      escalation_policy       = data.terraform_remote_state.incident_management.outputs.policy_default_non_critical_id
      auto_resolve_timeout    = null
      acknowledgement_timeout = 600
      alert_action            = "create_incidents"
      rule = {
        type    = "constant"
        urgency = "high"
      }
    }
    non-critical = {
      escalation_policy       = data.terraform_remote_state.incident_management.outputs.policy_default_non_critical_id
      auto_resolve_timeout    = 14400
      acknowledgement_timeout = 600
      alert_action            = "create_incidents"
      rule = {
        type    = "constant"
        urgency = "low"
      }
    }
  }
  pagerduty_integrations = [
    {
      escalation_level = "critical"
      vendor_name      = data.pagerduty_vendor.cloudwatch.name
      vendor_id        = data.pagerduty_vendor.cloudwatch.id
      subscription = {
        auto_confirm    = true
        confirm_timeout = 2
      }
    },
    {
      escalation_level = "non-critical"
      vendor_name      = data.pagerduty_vendor.cloudwatch.name
      vendor_id        = data.pagerduty_vendor.cloudwatch.id
      subscription = {
        auto_confirm    = true
        confirm_timeout = 2
      }
    }
  ]
}

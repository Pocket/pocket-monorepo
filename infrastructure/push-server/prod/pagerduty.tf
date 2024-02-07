locals {
  escalation_policy_critical_id     = data.terraform_remote_state.incident_management.outputs.policy_default_critical_id
  escalation_policy_non_critical_id = data.terraform_remote_state.incident_management.outputs.policy_default_non_critical_id
}

resource "pagerduty_service" "critical" {
  name                    = "${local.repo_context.name}-Critical"
  auto_resolve_timeout    = 14400
  acknowledgement_timeout = 600
  alert_creation          = "create_incidents"
  escalation_policy       = local.escalation_policy_critical_id

  incident_urgency_rule {
    type    = "constant"
    urgency = "high"
  }
}

resource "pagerduty_service" "non_critical" {
  name                    = "${local.repo_context.name}-Non-Critical"
  auto_resolve_timeout    = 14400
  acknowledgement_timeout = 600
  alert_creation          = "create_incidents"
  escalation_policy       = local.escalation_policy_non_critical_id

  incident_urgency_rule {
    type    = "constant"
    urgency = "low"
  }
}

data "pagerduty_vendor" "sentry" {
  name = "Sentry"
}

resource "pagerduty_service_integration" "sentry" {
  name    = data.pagerduty_vendor.sentry.name
  service = pagerduty_service.non_critical.id
  vendor  = data.pagerduty_vendor.sentry.id
  depends_on = [
    pagerduty_service.non_critical
  ]
}

data "pagerduty_vendor" "cloudwatch" {
  name = "Cloudwatch"
}

resource "pagerduty_service_integration" "cloudwatch_non_critical" {
  name    = data.pagerduty_vendor.cloudwatch.name
  service = pagerduty_service.non_critical.id
  vendor  = data.pagerduty_vendor.cloudwatch.id
}

resource "pagerduty_service_integration" "cloudwatch_critical" {
  name    = data.pagerduty_vendor.cloudwatch.name
  service = pagerduty_service.critical.id
  vendor  = data.pagerduty_vendor.cloudwatch.id
}

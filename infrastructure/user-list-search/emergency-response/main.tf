locals {
  prefix = var.name_prefix
  tags   = var.tags

  services     = var.pagerduty
  integrations = var.pagerduty_integrations != null ? var.pagerduty_integrations : []
}

resource "aws_sns_topic" "topics" {
  for_each = local.services
  name     = "${local.prefix}-SNS-${title(each.key)}"
  tags     = local.tags
}

resource "pagerduty_service" "pagerduty" {
  for_each                = local.services
  name                    = "${local.prefix}-PagerDuty-${title(each.key)}"
  auto_resolve_timeout    = each.value["auto_resolve_timeout"]
  acknowledgement_timeout = each.value["acknowledgement_timeout"]
  alert_creation          = each.value["alert_action"]
  escalation_policy       = each.value["escalation_policy"]

  incident_urgency_rule {
    type    = each.value["rule"]["type"]
    urgency = each.value["rule"]["urgency"]
  }
}

# generates a pagerduty service that receives an integration key that
# SNS subscriptions can use to hit PagerDuty
resource "pagerduty_service_integration" "integrations" {
  count   = length(local.integrations)
  name    = local.integrations[count.index]["vendor_name"]
  vendor  = local.integrations[count.index]["vendor_id"]
  service = pagerduty_service.pagerduty[local.integrations[count.index]["escalation_level"]]["id"]
}

# connects each pagerduty_service to its SNS escalation level
resource "aws_sns_topic_subscription" "pagerduty_subscriptions" {
  count                           = length(local.integrations)
  topic_arn                       = aws_sns_topic.topics[local.integrations[count.index]["escalation_level"]]["arn"]
  protocol                        = "https"
  endpoint                        = "https://events.pagerduty.com/integration/${pagerduty_service_integration.integrations[count.index]["integration_key"]}/enqueue"
  endpoint_auto_confirms          = local.integrations[count.index]["subscription"]["auto_confirm"]
  confirmation_timeout_in_minutes = local.integrations[count.index]["subscription"]["confirm_timeout"]
}

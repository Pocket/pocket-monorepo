variable "name_prefix" {
  type        = string
  description = "The prefix to append to all resource names"
}

variable "pagerduty" {
  type = map(object({
    escalation_policy       = string
    auto_resolve_timeout    = number
    acknowledgement_timeout = number
    alert_action            = string
    rule = object({
      type    = string
      urgency = string
    })
  }))
  description = "Defines a PagerDuty service associated with an escalation policy. Each key must correspond to a value in `escalation_levels`"
}

variable "pagerduty_integrations" {
  type = list(object({
    vendor_name      = string
    vendor_id        = string
    escalation_level = string
    subscription = object({
      auto_confirm    = bool
      confirm_timeout = number
    })
  }))
  default     = []
  description = "Adds integrations from other services to PagerDuty through an SNS subscription"
}

variable "tags" {
  type        = map(any)
  description = "Tags to apply to resources"
  default     = {}
}

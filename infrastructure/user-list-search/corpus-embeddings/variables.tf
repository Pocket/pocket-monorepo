variable "env" {
  description = "The deployment environment"
  type        = string
  validation {
    condition     = can(regex("^(Dev|Prod)$", var.env))
    error_message = "env can be one of Dev or Prod." 
  }
}
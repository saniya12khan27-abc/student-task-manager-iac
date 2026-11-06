variable "cloudflare_account_id" {
  description = "The Cloudflare Account ID where resources will be provisioned"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token with Workers Scripts and KV Storage edit permissions"
  type        = string
  sensitive   = true
}

variable "worker_name" {
  description = "The name of the Cloudflare Worker"
  type        = string
  default     = "student-task-manager"
}

variable "kv_namespace_name" {
  description = "The title of the Cloudflare Workers KV namespace"
  type        = string
  default     = "student_tasks"
}

variable "environment" {
  description = "Deployment environment (e.g. dev, test, production)"
  type        = string
  default     = "production"
}

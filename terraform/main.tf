# ==============================================================================
# INFRASTRUCTURE AS CODE (IaC): Serverless Student Task Management Application
# Cloud Platform: Cloudflare
# Resources: Cloudflare Workers KV, Cloudflare Workers Script, KV Binding
# ==============================================================================

# 1. Cloudflare Workers KV Namespace for persistent student task records
resource "cloudflare_workers_kv_namespace" "tasks_kv" {
  account_id = var.cloudflare_account_id
  title      = var.kv_namespace_name
}

# 2. Cloudflare Worker Script running REST API and serving UI
resource "cloudflare_workers_script" "task_manager_worker" {
  account_id         = var.cloudflare_account_id
  name               = var.worker_name
  content            = file("${path.module}/../application/worker.js")
  module             = true
  compatibility_date = "2024-01-01"

  # Connect Worker with KV Namespace via TASKS_KV binding
  kv_namespace_binding {
    name         = "TASKS_KV"
    namespace_id = cloudflare_workers_kv_namespace.tasks_kv.id
  }

  plain_text_binding {
    name = "ENVIRONMENT"
    text = var.environment
  }
}



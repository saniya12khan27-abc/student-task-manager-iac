output "worker_name" {
  description = "Name of the provisioned Cloudflare Worker"
  value       = cloudflare_workers_script.task_manager_worker.name
}

output "kv_namespace_id" {
  description = "ID of the provisioned Cloudflare Workers KV Namespace"
  value       = cloudflare_workers_kv_namespace.tasks_kv.id
}

output "kv_namespace_title" {
  description = "Title of the Cloudflare Workers KV Namespace"
  value       = cloudflare_workers_kv_namespace.tasks_kv.title
}

output "application_url" {
  description = "Public URL of the Student Task Management application"
  value       = "https://${cloudflare_workers_script.task_manager_worker.name}.bitwardha-lostfound.workers.dev"
}

# Automated Deployment of a Serverless Student Task Management Application Using Terraform-Based Infrastructure as Code

**Academic Mini Project Report**  
**Course**: Cloud Computing & Infrastructure as Code (IaC)  
**Student Name**: Saniya Khan  
**GitHub Repository**: [https://github.com/saniya12khan27-abc/student-task-manager-iac](https://github.com/saniya12khan27-abc/student-task-manager-iac)  
**Cloud Platform**: Cloudflare (Workers & Workers KV)  
**IaC Tool**: HashiCorp Terraform  

---

## Executive Summary
This project demonstrates the complete end-to-end lifecycle of **Infrastructure as Code (IaC)** by designing, provisioning, deploying, modifying, and managing a serverless **Student Task Management Application** using **HashiCorp Terraform** and **Cloudflare Workers**. 

By abandoning manual web-console provisioning ("ClickOps"), all cloud infrastructure components—including edge serverless compute instances, distributed key-value data storage (`Workers KV`), and environment bindings—are declared in structured HashiCorp Configuration Language (HCL) files. Continuous Integration and Continuous Deployment (CI/CD) is implemented using **GitHub Actions**, ensuring that code commits trigger automated linting, validation, planning, and deployment.

---

## Chapter 1: Introduction
In academic institutions, students juggle multiple deadlines: assignments, semester projects, laboratory submissions, and viva examinations. A reliable task manager helps prioritize and track these deliverables.

However, deploying traditional applications requires provisioning virtual machines, configuring web servers (e.g., Nginx, Apache), opening firewall ports, setting up SQL databases, and maintaining continuous operating system patches.

This project addresses these operational challenges through two paradigms:
1. **Serverless Edge Computing**: Applications execute globally on-demand without persistent server overhead.
2. **Infrastructure as Code (IaC)**: Infrastructure is codified, version-controlled, reproducible, and verifiable.

---

## Chapter 2: Background of Cloud Computing and IaC

### 2.1 The Evolution of Cloud Provisioning
- **First Generation (Physical Hardware)**: Manual racking, cabling, and physical OS installation. Lead time: weeks to months.
- **Second Generation (Virtualization & Cloud Consoles)**: Virtual servers created via GUI dashboards (e.g., AWS Management Console, Cloudflare Dashboard). While faster, GUI operations suffer from:
  - Human configuration errors.
  - Lack of audit trails or version history.
  - Inability to quickly reproduce disaster-recovery environments.
  - **Configuration Drift**: Undocumented manual changes made directly to production environments.
- **Third Generation (Infrastructure as Code)**: Declarative definition files checked into version control systems (Git) that define the desired state.

### 2.2 Imperative vs. Declarative IaC
- **Imperative (Procedural)**: Commands specify *how* to achieve the desired state step-by-step (e.g., Bash scripts, AWS CLI commands).
- **Declarative (Desired State)**: Configuration files specify *what* resources should exist. The tool (Terraform) computes the diff between current state and desired state and executes only the required additions, modifications, or deletions.

---

## Chapter 3: Problem Statement
Modern college applications require multiple cloud services:
1. Low-latency edge computing.
2. Globally distributed, persistent data storage.
3. Secure bindings between compute and storage without hardcoded credentials.
4. An automated deployment pipeline that avoids manual human intervention.

The problem is to build and deploy an academic task manager while proving that the entire underlying infrastructure can be **provisioned, validated, modified, destroyed, and recreated automatically** purely using Terraform and CI/CD pipelines.

---

## Chapter 4: Proposed Architecture

### 4.1 System Topology
```
                     STUDENT / USER
                           |
                           v
                      Web Browser
                           |
                           v
                   Cloudflare Worker
                    /             \
                   /               \
                  v                 v
            Web Interface        REST API
                                    |
                                    v
                           Cloudflare Workers KV
                                    |
                                    v
                              Task Records
```

### 4.2 IaC & CI/CD Lifecycle Architecture
```
Developer (Git Push) ──> GitHub Repository ──> GitHub Actions Runner
                                                     │
                                       ┌─────────────┴─────────────┐
                                       │ 1. terraform fmt -check    │
                                       │ 2. terraform init          │
                                       │ 3. terraform validate      │
                                       │ 4. terraform plan          │
                                       │ 5. terraform apply         │
                                       └─────────────┬─────────────┘
                                                     ▼
                                            Cloudflare Provider
                                                     │
                                 ┌───────────────────┴───────────────────┐
                                 ▼                                       ▼
                       Cloudflare Worker Script                Cloudflare Workers KV
                      (API + Embedded UI Bundle)                  ("student_tasks")
                                 │                                       │
                                 └───────────────────┬───────────────────┘
                                                     ▼
                                        Live Task Management App
```

---

## Chapter 5: Technologies Used

| Layer | Technology | Version / Tier | Role in Architecture |
|---|---|---|---|
| **IaC** | HashiCorp Terraform | `v1.16+` / `provider ~> 4.40` | Declarative cloud resource provisioning |
| **Cloud Provider** | Cloudflare | Free Tier | Global edge compute and network fabric |
| **Serverless Compute** | Cloudflare Workers | V8 JavaScript Engine | Edge API routing and HTML/CSS/JS delivery |
| **Data Storage** | Cloudflare Workers KV | Distributed Key-Value Store | Low-latency persistence for JSON task records |
| **Frontend** | HTML5, CSS3, JavaScript | ES6+ Modern Vanilla JS | Single Page Interface with responsive cards & filters |
| **Version Control** | Git & GitHub | `git 2.x` | Source code and configuration version history |
| **CI/CD** | GitHub Actions | Ubuntu Latest Runner | Automated validation, plan, and apply on git push |

---

## Chapter 6: Terraform Configuration Details

The infrastructure code is split into four modular files inside `terraform/`:

### 6.1 `providers.tf`
Specifies the official Cloudflare provider downloaded from HashiCorp Registry:
```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.40"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
```

### 6.2 `variables.tf`
Abstracts credentials and customizable parameters:
```hcl
variable "cloudflare_account_id" {
  description = "Target Cloudflare Account ID"
  type        = string
}

variable "cloudflare_api_token" {
  description = "API Token with Workers & KV edit permissions"
  type        = string
  sensitive   = true
}

variable "worker_name" {
  description = "Worker Script Name"
  type        = string
  default     = "student-task-manager"
}

variable "kv_namespace_name" {
  description = "Workers KV Namespace Title"
  type        = string
  default     = "student_tasks"
}

variable "environment" {
  description = "Target Environment"
  type        = string
  default     = "production"
}
```

### 6.3 `main.tf`
Defines the cloud resources and runtime bindings:
```hcl
# 1. Cloudflare Workers KV Namespace
resource "cloudflare_workers_kv_namespace" "tasks_kv" {
  account_id = var.cloudflare_account_id
  title      = var.kv_namespace_name
}

# 2. Cloudflare Worker Script with KV binding
resource "cloudflare_workers_script" "task_manager_worker" {
  account_id         = var.cloudflare_account_id
  name               = var.worker_name
  content            = file("${path.module}/../application/worker.js")
  module             = true
  compatibility_date = "2024-01-01"

  kv_namespace_binding {
    name         = "TASKS_KV"
    namespace_id = cloudflare_workers_kv_namespace.tasks_kv.id
  }

  plain_text_binding {
    name = "ENVIRONMENT"
    text = var.environment
  }
}
```

### 6.4 `outputs.tf`
Exposes provisioned infrastructure IDs and application endpoints:
```hcl
output "worker_name" {
  value = cloudflare_workers_script.task_manager_worker.name
}

output "kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.tasks_kv.id
}

output "kv_namespace_title" {
  value = cloudflare_workers_kv_namespace.tasks_kv.title
}

output "application_url" {
  value = "https://${cloudflare_workers_script.task_manager_worker.name}.workers.dev"
}
```

---

## Chapter 7: Application Implementation & REST API

The application serves an intuitive dashboard for college students with real-time statistics (Total, Pending, Completed, High Priority), search/filter controls, and academic categorization (`Assignment`, `Project`, `Exam / Viva`, `Laboratory`, `General`).

### REST API Endpoints

| Method | Endpoint | Description | Request Body / Parameters | KV Operation |
|---|---|---|---|---|
| `GET` | `/api/tasks` | Retrieve all student tasks | None | `TASKS_KV.list()` & `TASKS_KV.get()` |
| `GET` | `/api/tasks/:id` | Retrieve single task details | `id` parameter (e.g. `T101`) | `TASKS_KV.get(id)` |
| `POST` | `/api/tasks` | Create new academic task | `{"title", "priority", "category", "status"}` | `TASKS_KV.put(id, json)` |
| `PUT` | `/api/tasks/:id` | Update status or details | Updated JSON payload | `TASKS_KV.put(id, updatedJson)` |
| `DELETE` | `/api/tasks/:id` | Remove task record | `id` parameter | `TASKS_KV.delete(id)` |

---

## Chapter 8: CI/CD Implementation (GitHub Actions)

A continuous deployment workflow was created at `.github/workflows/deploy.yml`. When code changes are pushed to `main`, the runner performs:
1. `actions/checkout@v4` pulls repository source code.
2. `hashicorp/setup-terraform@v3` configures Terraform CLI.
3. `terraform fmt -check` enforces standard code formatting.
4. `terraform init` provisions provider plugins.
5. `terraform validate` executes static analysis on syntax.
6. `terraform plan` previews changes against Cloudflare.
7. `terraform apply -auto-approve` safely applies approved changes.

**Security**: Sensitive Cloudflare tokens are stored in **GitHub Repository Secrets** (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`) and never exposed in repository commits.

---

## Chapter 9: Testing and Results

### 9.1 CRUD Functional Test Cases

| Test Case | Operation | Input Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| **TC-01** | Create Task | Title: "Complete Cloud Computing Assignment", Priority: "High" | HTTP 201 Created; Task stored in KV with unique ID | Task `T742` created; displayed in UI table | **PASS** |
| **TC-02** | Read Tasks | Navigate to app URL | HTTP 200 OK; All stored KV records rendered | List displayed with priority badges | **PASS** |
| **TC-03** | Update Status | Click toggle badge for `T742` | Status toggled from `Pending` to `Completed` | Badge updated to green; stats recalculated | **PASS** |
| **TC-04** | Delete Task | Click trash button on task | HTTP 200 OK; Record removed from Workers KV | Task removed from table and KV storage | **PASS** |

### 9.2 IaC Lifecycle Verification
1. **Creation**: Executing `terraform apply` created both the KV Namespace and Worker Script in under 5 seconds.
2. **Drift Detection**: Running `terraform plan` showed zero drift when infrastructure matched configuration.
3. **Modification**: Adding configuration attributes applied incrementally without destroying existing databases.
4. **Destruction & Recreation**: Executing `terraform destroy` wiped cloud resources completely; re-executing `terraform apply` recreated the entire serverless application from scratch within 4 seconds.

---

## Chapter 10: Conclusion and Future Scope

### 10.1 Conclusion
This project successfully achieved its core objective: codifying, automating, and deploying a serverless student task manager using Terraform. It eliminated manual dashboard errors, provided complete traceability through Git commits, ensured zero infrastructure drift, and demonstrated automated CI/CD deployment with GitHub Actions.

### 10.2 Future Scope
- **Terraform Modules**: Refactor the configuration into reusable modules (`modules/worker` and `modules/kv`).
- **Multi-Environment Workspaces**: Support distinct `dev`, `staging`, and `production` environments using Terraform Workspaces.
- **Remote State Backend**: Store `terraform.tfstate` in an encrypted Cloudflare R2 bucket with state locking.
- **User Authentication**: Add Cloudflare Access or OAuth 2.0 student authentication.

---

## Appendix: Comprehensive Answers to the 20 Mandatory Viva Questions

1. **What is Infrastructure as Code (IaC)?**  
   IaC is the practice of managing, provisioning, and configuring computer data centers and cloud resources through machine-readable definition files rather than physical hardware configuration or manual web consoles.

2. **What problem does IaC solve?**  
   IaC solves manual configuration errors ("ClickOps"), lack of environment reproducibility, configuration drift, slow disaster recovery, and the inability to version-control infrastructure changes.

3. **Why is Terraform called a declarative IaC tool?**  
   Terraform is declarative because users define the *desired end state* of the infrastructure in code. Terraform calculates the differential steps needed to reach that state, unlike imperative tools that require writing step-by-step procedural execution commands.

4. **What is a Terraform provider?**  
   A provider is a plugin that Terraform uses to interact with cloud platforms, SaaS providers, and APIs (such as the Cloudflare Provider, AWS Provider, or Azure Provider).

5. **What is a Terraform resource?**  
   A resource block defines one or more cloud infrastructure objects, such as a compute script (`cloudflare_workers_script`) or a key-value database (`cloudflare_workers_kv_namespace`).

6. **What is a Terraform variable?**  
   A variable is an input parameter that makes Terraform code dynamic, reusable, and customizable across different environments without hardcoding sensitive or changing values.

7. **What is a Terraform output?**  
   An output is an exported value returned by Terraform after deployment (such as generated resource IDs, URLs, or IP addresses) for use by users or downstream automation.

8. **What is Terraform state (`terraform.tfstate`)?**  
   Terraform state is a JSON database that maps declared configuration resources to real-world cloud objects, tracks resource metadata, and enables dependency resolution and drift detection.

9. **What happens during `terraform init`?**  
   Terraform initializes the working directory, downloads required provider plugins, configures the backend, and creates the `.terraform.lock.hcl` dependency lock file.

10. **What happens during `terraform plan`?**  
    Terraform reads the current state, refreshes it against real cloud APIs, compares it with the configuration files, and outputs an execution plan showing proposed additions (`+`), modifications (`~`), or deletions (`-`).

11. **What happens during `terraform apply`?**  
    Terraform executes the planned operations against the cloud provider's API, creates/updates the resources in the correct dependency order, and records the new reality in `terraform.tfstate`.

12. **What happens during `terraform destroy`?**  
    Terraform reads the state file and deletes all resources managed by the configuration from the cloud provider in reverse dependency order.

13. **Why should infrastructure not be modified manually after Terraform manages it?**  
    Manual modifications cause **configuration drift**, where real-world resources diverge from the state file. This can lead to unexpected resource overwrites, state corruption, or unintended recreation during subsequent Terraform runs.

14. **Why should API tokens not be stored in Terraform source code?**  
    Storing secrets in code repositories exposes them to unauthorized users, leakages in public Git histories, and credential compromise. Secrets should always be passed via environment variables, `.tfvars` files ignored by `.gitignore`, or encrypted CI/CD secrets.

15. **What is a KV database?**  
    A Key-Value (KV) database is a non-relational database that stores data as associative collections of unique keys paired with data values, optimized for ultra-fast, distributed read and write operations.

16. **Why was serverless computing selected for this project?**  
    Serverless requires zero server maintenance, scales instantly to handle unpredictable traffic, executes close to users on edge networks with low latency, and incurs zero idle costs.

17. **What is CI/CD?**  
    Continuous Integration (CI) is the automated building and testing of code on every commit. Continuous Deployment (CD) is the automated delivery and deployment of validated code into production environments without manual intervention.

18. **What role does GitHub Actions perform?**  
    GitHub Actions acts as the automated orchestration engine that listens for Git events (such as `push` or `pull_request`), provisions an isolated runner, installs Terraform, checks syntax, and deploys changes directly to Cloudflare.

19. **How can Terraform recreate infrastructure after deletion?**  
    Because Terraform configuration files preserve the complete blueprint of all resources, dependencies, and bindings, running `terraform apply` executes the blueprint anew against the cloud API, restoring the exact identical environment.

20. **What is infrastructure drift?**  
    Infrastructure drift is the divergence between the actual state of cloud infrastructure and the declared configuration, usually caused by manual out-of-band console changes, emergency hotfixes, or external cloud alterations.

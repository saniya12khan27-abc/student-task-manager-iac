# Automated Deployment of a Serverless Student Task Management Application Using Terraform-Based Infrastructure as Code

[![Terraform CI/CD Deployment](https://github.com/your-username/student-task-manager-iac/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-username/student-task-manager-iac/actions)

## 1. Problem Statement & Objective
Modern cloud applications require compute, storage, configuration, and environment setup. Manually creating these resources via web dashboards leads to human errors, lack of reproducibility, configuration drift, and difficult maintenance.

**Infrastructure as Code (IaC)** solves these problems by declaring all infrastructure configuration in machine-readable files.

In this project, a **Serverless Student Task Management Application** is provisioned on **Cloudflare Workers** with **Cloudflare Workers KV** data storage entirely through **Terraform**.

---

## 2. Architecture

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

### Infrastructure Provisioning Flow:
```
GitHub Repository ──> GitHub Actions ──> Terraform ──> Cloudflare Provider
                                                            |
                                        +-------------------+-------------------+
                                        |                                       |
                                        v                                       v
                              Cloudflare Worker Script                 Cloudflare Workers KV
                                        |                                       |
                                        +-------------------+-------------------+
                                                            |
                                                            v
                                               Student Task Manager Web App
```

---

## 3. Technologies Used
- **IaC Tool**: HashiCorp Terraform (`>= 1.5.0`)
- **Cloud Platform**: Cloudflare (Free Tier)
- **Serverless Compute**: Cloudflare Workers
- **Database / Storage**: Cloudflare Workers KV
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **API**: Cloudflare Workers JavaScript REST API (`/api/tasks`)
- **Version Control**: Git & GitHub
- **CI/CD**: GitHub Actions

---

## 4. Directory Structure
```
student-task-manager-iac/
│
├── terraform/
│   ├── providers.tf             # Cloudflare provider configuration
│   ├── main.tf                  # Worker, KV namespace, and binding resources
│   ├── variables.tf             # Configuration variable definitions
│   ├── outputs.tf               # Infrastructure outputs (URL, IDs)
│   └── terraform.tfvars.example # Template for account credentials
│
├── application/
│   ├── worker.js                # Cloudflare Worker code (API + Web Server)
│   ├── index.html               # Frontend User Interface
│   ├── style.css                # Application Stylesheet
│   └── script.js                # Frontend CRUD & Search logic
│
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions CI/CD pipeline
│
├── screenshots/                 # Required project submission screenshots
│   └── README.md                # Screenshots checklist
│
├── .gitignore                   # Ignores secrets and terraform state
└── README.md                    # Project documentation & Viva guide
```

---

## 5. Local Setup & Execution Guide

### Step 1: Configure Cloudflare Credentials
1. Copy `terraform/terraform.tfvars.example` to `terraform/terraform.tfvars`:
   ```bash
   cp terraform/terraform.tfvars.example terraform/terraform.tfvars
   ```
2. Open `terraform/terraform.tfvars` and provide:
   ```hcl
   cloudflare_account_id = "<YOUR_CLOUDFLARE_ACCOUNT_ID>"
   cloudflare_api_token  = "<YOUR_CLOUDFLARE_API_TOKEN>"
   ```

### Step 2: Initialize Terraform
```bash
cd terraform
terraform init
```
*Downloads the Cloudflare Terraform provider.*

### Step 3: Format and Validate
```bash
terraform fmt
terraform validate
```
*Ensures code formatting and configuration syntax are valid.*

### Step 4: Preview Execution Plan
```bash
terraform plan
```
*Inspect planned resources: Worker, KV Namespace, and KV Binding.*

### Step 5: Provision Infrastructure
```bash
terraform apply
```
*Type `yes` when prompted. Terraform creates the resources in Cloudflare and outputs the application URL.*

### Step 6: Test the Application
Open the URL printed in the Terraform output (e.g. `https://student-task-manager.workers.dev`):
- **Create**: Add a task (e.g., Title: "Cloud Computing Assignment", Priority: "High").
- **Read**: Confirm the task appears in the table.
- **Update**: Click the status badge to toggle between `Pending` and `Completed`.
- **Delete**: Click the trash icon to remove the task from KV storage.

### Step 7: Demonstrate Infrastructure Lifecycle (Modify & Destroy)
- **Modify**: Update `worker_name` or add an environment variable in `main.tf`, then run `terraform apply`.
- **Destroy**: Remove all infrastructure automatically:
  ```bash
  terraform destroy
  ```
- **Recreate**: Re-run `terraform apply` to demonstrate reproducible IaC recreation.

---

## 6. GitHub CI/CD Pipeline
1. Initialize Git in the project root:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Serverless Student Task Manager with Terraform"
   ```
2. Create a GitHub repository and push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/student-task-manager-iac.git
   git branch -M main
   git push -u origin main
   ```
3. In your GitHub repository, navigate to **Settings** → **Secrets and variables** → **Actions** and add:
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API Token
4. Any push to `main` will automatically trigger the GitHub Actions workflow in `.github/workflows/deploy.yml`.

---

## 7. Viva Q&A Reference

### Q1: What is Infrastructure as Code (IaC)?
**Answer**: IaC is the practice of managing and provisioning computing infrastructure through machine-readable definition files rather than physical hardware configuration or interactive web consoles.

### Q2: Why is Terraform called a declarative IaC tool?
**Answer**: In Terraform, we define the *desired end state* of the infrastructure (what resources should exist), and Terraform determines the steps required to achieve that state, unlike imperative tools which define specific execution steps.

### Q3: What is Terraform state (`terraform.tfstate`)?
**Answer**: Terraform state records metadata and mappings between the declared configuration files and the real-world cloud resources. It allows Terraform to track changes, detect drift, and perform safe modifications.

### Q4: What is the purpose of `terraform plan`?
**Answer**: `terraform plan` creates an execution plan by comparing the current state of infrastructure with the declared configuration, highlighting what will be created (`+`), modified (`~`), or destroyed (`-`).

### Q5: What is Cloudflare Workers KV?
**Answer**: Workers KV is a global, low-latency key-value data store designed for serverless applications running on Cloudflare's edge network.

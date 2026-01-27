# AWS Infrastructure Projects

This repository contains a collection of AWS infrastructure projects managed with Terraform and automated with GitHub Actions.

## Projects

### 1. EC2 Scheduler (`proj-ec2-scheduler`)

This project implements a cost-saving solution that automatically starts and stops EC2 instances based on a predefined schedule.

- **Infrastructure (`/infra`):** Terraform code to provision the necessary AWS resources, including a Lambda function, DynamoDB table for scheduling data, and EventBridge rules to trigger the Lambda.
- **Lambda Code (`/lambda_code`):** The Python source code for the Lambda function that handles the EC2 start/stop logic.

### 2. Networking (`/networking`)

This section contains Terraform projects related to network infrastructure.

- **VPC Design (`/vpc-design`):** A reusable Terraform module to create a standardized Virtual Private Cloud (VPC). It's designed with separate environments for `dev` and `prod`.
- **SD-WAN Design (`/sdwan-design`):** A project for setting up an SD-WAN architecture on AWS.

## Terraform Project Structure

Each project follows a standardized Terraform directory structure to ensure consistency across the repository.

```
.
├── envs/
│   ├── dev/
│   │   ├── backend.tf
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   └── prod/
│       ├── backend.tf
│       ├── main.tf
│       └── terraform.tfvars
└── modules/
    └── vpc/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

- **`envs/`**: Contains the environment-specific configurations (`dev`, `prod`, etc.). Each environment has its own `backend.tf` for remote state and `terraform.tfvars` for environment-specific variables.
- **`modules/`**: Contains reusable Terraform modules, like the `vpc` module.

## CI/CD Deployment Flow

The repository uses GitHub Actions for continuous integration and deployment.

### Development Flow
Push to `main` branch:
- Detects changes in project folders.
- Automatically plans and applies the Terraform configuration to the **DEV** environment.

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT FLOW                          │
└─────────────────────────────────────────────────────────────┘

Push to main
     │
     ├─→ Detect Changes
     │
     ├─→ terraform-dev job
     │       ├─→ Plan
     │       └─→ Apply (AUTO - No Approval)
     │
     └─→ ✅ Deployed to DEV
```

### Production Flow
Pull Request to `main` branch:
- A `terraform plan` is generated and commented on the PR for review.
- Merging the PR to `main` requires manual approval in the GitHub Actions workflow before applying changes to the **PROD** environment.

```
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCTION FLOW                            │
└─────────────────────────────────────────────────────────────┘

Create PR
     │
     ├─→ Detect Changes
     │
     ├─→ terraform-prod-plan job
     │       ├─→ Plan (Read-Only Role)
     │       └─→ Comment on PR with plan
     │
Merge PR to main
     │
     ├─→ Detect Changes
     │
     ├─→ terraform-prod-apply job
     │       ├─→ ⏸️  WAIT FOR MANUAL APPROVAL
     │       ├─→ Plan (final verification)
     │       └─→ Apply
     │
     └─→ ✅ Deployed to PROD
```

## Key Files & Configuration

- **CI/CD Workflow:** `.github/workflows/terraform-cicd.yml`
- **Backend Config:** `*/envs/{dev,prod}/backend.tf`
- **Variables:** `*/envs/{dev,prod}/terraform.tfvars`
- **State Storage:** S3 bucket (defined in `backend.tf`)
- **State Locking:** DynamoDB table (defined in `backend.tf`)

## Local Usage

To run any of the Terraform projects locally, navigate to the environment-specific directory and use the following commands:

```bash
# Navigate to the desired project and environment
cd networking/vpc-design/envs/dev

# Initialize Terraform
terraform init

# Generate a plan
terraform plan

# Apply the changes
terraform apply
```
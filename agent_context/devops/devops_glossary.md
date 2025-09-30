# DevOps Glossary

This glossary defines key terms, acronyms, and company-specific terminology used throughout the DevOps agent contexts. This reference ensures consistent understanding and prevents misinterpretation of technical terms.

## A

**ALB** - Application Load Balancer. AWS service that distributes incoming application traffic across multiple targets.

**ArgoCD** - GitOps continuous delivery tool for Kubernetes. Manages application deployments declaratively using Git as the source of truth.

**Aurora** - Amazon Aurora, a cloud-native relational database service. Available in PostgreSQL and MySQL variants with automatic scaling and high availability.

## C

**CI/CD** - Continuous Integration/Continuous Deployment. Automated processes for building, testing, and deploying software.

**CMK** - Customer Managed Key. AWS KMS encryption key managed by the customer rather than AWS.

**Cognito** - Amazon Cognito, AWS service for user authentication and authorization.

## D

**DB** - Database. In our context, typically refers to RDS or Aurora database instances.

**DNS** - Domain Name System. Translates domain names to IP addresses.

## E

**EKS** - Amazon Elastic Kubernetes Service. Managed Kubernetes service on AWS.

**EKS Auto Mode** - Simplified EKS configuration that automatically manages node groups, networking, and other infrastructure components.

**EFS** - Amazon Elastic File System. Managed NFS file system for EC2 instances.

**ECR** - Amazon Elastic Container Registry. Managed Docker container registry service.

**ECS** - Amazon Elastic Container Service. Container orchestration service for running containerized applications.

**External Secrets Operator** - Kubernetes operator that synchronizes secrets from external systems (like AWS Secrets Manager) into Kubernetes secrets.

## F

**Freedom CLI** - In-house command-line tool housed in the `ci-tools` directory for database operations, deployments, and package management.

## G

**GitOps** - Operational model using Git as the single source of truth for declarative infrastructure and applications.

## H

**HCL** - HashiCorp Configuration Language. The configuration language used by Terraform.

**HPA** - Horizontal Pod Autoscaler. Kubernetes resource that automatically scales the number of pods based on CPU or memory usage.

## I

**IaC** - Infrastructure as Code. Managing and provisioning infrastructure through code rather than manual processes.

**IAM** - Identity and Access Management. AWS service for managing access to AWS resources.

**Ingress** - Kubernetes resource that manages external access to services, typically HTTP/HTTPS.

## K

**KMS** - AWS Key Management Service. Service for creating and managing encryption keys.

**Karpenter** - Kubernetes node provisioning system that automatically provisions nodes based on workload requirements.

## L

**Lifecycle** - Terraform lifecycle block that controls resource behavior during creation, updates, and destruction.

## M

**Metabase** - Open-source business intelligence tool for data visualization and analytics.

**Mend** - Dependency management tooling used for external module versioning.

## N

**NACL** - Network Access Control List. AWS security layer that acts as a firewall for controlling traffic in and out of subnets.

**NHHA** - National Hospital and Health Association. Internal service for bed board management.

**Nx** - Monorepo management tool used for building, testing, and deploying multiple packages from a single repository.

## O

**OIDC** - OpenID Connect. Identity layer on top of OAuth 2.0 for authentication.

## P

**Pod Identity** - EKS feature that allows pods to assume IAM roles without storing AWS credentials.

**PADS** - Patient Admission and Discharge System. Digital signature service.

## R

**RDS** - Amazon Relational Database Service. Managed database service supporting multiple database engines.

**RBAC** - Role-Based Access Control. Authorization method based on user roles and permissions.

## S

**S3** - Amazon Simple Storage Service. Object storage service for storing and retrieving data.

**SecretStore** - External Secrets Operator resource that defines how to connect to external secret management systems.

**Service Account** - Kubernetes resource that provides identity for processes running in pods.

**SOC2** - System and Organization Controls 2. Security compliance framework for service organizations.

## T

**Terraform** - Infrastructure as Code tool by HashiCorp for building, changing, and versioning infrastructure.

**Terraform-aws-modules** - Community-driven collection of Terraform modules for AWS services.

## V

**VPC** - Virtual Private Cloud. Isolated network environment within AWS.

## Company-Specific Terms

**Chorus Platform** - Main platform offering, accessible at `chorusplatform.io`.

**AJC** - UCLA account for production workloads, accessible at `app.joinchorus.com`.

**CARES** - Armen Arevian account for development work, accessible at `{developer}.chorus.care`.

**Legacy Infrastructure** - Existing Chorus Platform infrastructure in production-ucla and chorus-production accounts.

**GitOps Platform Infrastructure** - Modern infrastructure managed via GitOps from the `platform` repository, deployed to dedicated AWS accounts (production, staging, development).

**Internal Services** - Company-developed services and applications.

**Third-party Services** - External services and tools integrated into the platform.

**Legacy Services** - Older services that may be deprecated or maintained for backward compatibility.

## Environment Naming

**Development** - Environment for development and testing of GitOps Platform Infrastructure.

**Staging** - Pre-production environment for validation before production deployment.

**Production** - Live production environment serving end users.

**Lab** - Experimental environment for testing and proof-of-concept work.

## Module Categories

**aws-services** - Modules for core AWS services (Aurora, RDS, EFS, etc.).

**internal-services** - Modules for company-developed services (NHHA, PADS, etc.).

**legacy-services** - Modules for maintaining legacy infrastructure.

**thirdparty-services** - Modules for external service integrations (Metabase, ArgoCD, etc.).

## Security & Compliance

**HIPAA** - Health Insurance Portability and Accountability Act. Healthcare data protection regulation.

**HITRUST** - Health Information Trust Alliance. Healthcare security framework.

**Least Privilege** - Security principle of granting minimum necessary permissions.

**Encryption at Rest** - Data encryption when stored on disk.

**Encryption in Transit** - Data encryption when transmitted over networks.

## Tagging Strategy

**Cost Allocation Tags** - Tags for tracking costs by application, project, client, and owner.

**Operations Tags** - Tags for operational management (environment, managed by, maintenance window, etc.).

**Data Classification Tags** - Tags for compliance and governance (public, private, confidential, restricted).

**Compliance Tags** - Tags for regulatory frameworks (PCI-DSS, HIPAA).

## Secrets Management

**Hierarchical Naming** - Secret naming convention: `{environment}/{client}/{project}/{secret_name}`.

**External-Secrets Tag** - Special tag (`internal:operations:SecretType = "External-Secrets"`) for secrets managed by External Secrets Operator.

**Lifecycle Policies** - Terraform rules for managing secret lifecycle (ignore_changes, prevent_destroy, etc.).

## Deployment Patterns

**GitHub Actions** - CI/CD platform for automated workflows.

**Manual Deployment** - ❌ **FORBIDDEN** - Never run `terraform apply` manually.

**Automated Deployment** - ✅ **REQUIRED** - All deployments must use GitHub Actions workflows.

**Nx Affected** - Command to run operations only on packages affected by changes.

**Freedom CLI** - Internal tool for database migrations, deployments, and package management.

---

_This glossary is maintained as part of the DevOps agent contexts and should be referenced when encountering unfamiliar terms or acronyms._

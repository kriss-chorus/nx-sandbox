# Agent Context Guide - Entrypoint

BEFORE YOU DO WORK, REVIEW THE FILES RELEVANT TO YOUR TASK.
BEFORE YOU DO WORK, REVIEW THE FILES RELEVANT TO YOUR TASK.
BEFORE YOU DO WORK, REVIEW THE FILES RELEVANT TO YOUR TASK.

This is the main entrypoint for AI agents working on this codebase. Each section below links to focused documentation files to minimize context window usage.

## 🚀 Quick Start

1. **Project Setup**: [Tooling & Commands](./tooling/nx-commands.md) - Start here for project structure and build commands
2. **Frontend Development**: See frontend section below for React/MUI patterns
3. **Backend Development**: See backend section for NestJS/GraphQL patterns

- **[GraphQL Best Practices Guide](./graphql-best-practices-guide.md)** - Comprehensive GraphQL patterns
- **[GraphQL Architecture Guide](./graphql-architecture.md)** - CRUD vs Domain graph, PostGraphile patterns

## 📁 Frontend Documentation

### Core Patterns

- **[React Patterns](./frontend/react-patterns.md)** - Component structure, hooks, and React best practices
- **[State Management](./frontend/state-management.md)** - @platform/common-state patterns, typed store hooks, immutable updates with Mutative
- **[Component Library Usage](./frontend/component-library.md)** - @platform/signature-component-library vs MUI decision tree

### UI & Styling

- **[MUI Component Usage](./frontend/mui-usage.md)** - Material UI v6 patterns and migration guide
- **[CSS & Styling Patterns](./frontend/styling-patterns.md)** - Emotion CSS patterns, theme variables, spacing
- **[Icon Usage](./frontend/icon-usage.md)** - FontAwesome Pro and MUI icons hierarchy

### Forms & Data

- **[Form Patterns](./frontend/form-patterns.md)** - React Hook Form patterns and validation
- **[Apollo Client Patterns](./frontend/apollo-patterns.md)** - Query/mutation patterns, error handling

## 🔧 Backend Documentation

### Core Patterns

- **[NestJS Patterns](./backend/nestjs-patterns.md)** - Service structure, dependency injection, DTOs
- **[Database Patterns](./backend/database-patterns.md)** - Drizzle ORM, transactions, migrations
- **[GraphQL Backend](./backend/graphql-backend.md)** - Code-first approach, resolvers, input types
- **[API Calling](./frontend/api-call-patterns.md)** - Using `@platform/api-call` for raw HTTP requests

### Testing

- **[Testing Patterns](./backend/testing-patterns.md)** - Integration tests, test database, cleanup strategies

## 🛠 Tooling & Project Structure

- **[NX Commands & Project Setup](./tooling/nx-commands.md)** - NX/pnpm usage, project.json commands
- **[Package Management](./tooling/package-management.md)** - Workspace packages, dependencies

## 🏗 DevOps & Infrastructure Documentation

### Reference Materials

- **[DevOps Glossary](./devops/devops_glossary.md)** - Key terms, acronyms, and company-specific terminology
- **[DevOps Manifest](./devops/devops_manifest.yaml)** - Complete environment configuration, AWS accounts, and infrastructure details

### Core Infrastructure Patterns

- **[Terraform Patterns](./devops/terraform-patterns.md)** - Infrastructure as Code, module patterns, state management, directory structure
- **[AWS Patterns](./devops/aws-patterns.md)** - AWS service integration, KMS/CMK patterns, security best practices
- **[Kubernetes Patterns](./devops/kubernetes-patterns.md)** - EKS Auto Mode, workload deployment, ArgoCD integration, Helm charts
- **[GitHub Actions Patterns](./devops/github-actions-patterns.md)** - CI/CD workflows, reusable actions, environment management
- **[Environment Mapping Patterns](./devops/environment-mapping-patterns.md)** - AWS account structure, environment mapping, decision guidance

### Security & Compliance Patterns

- **[Tagging Patterns](./devops/tagging-patterns.md)** - Hierarchical tagging strategy, cost allocation, compliance, and operational tags
- **[Secrets Management Patterns](./devops/secrets-management-patterns.md)** - AWS Secrets Manager integration, lifecycle policies, External Secrets Operator

## 🎯 Quick Reference Rules

### Most Important Rules

0. ALWAYS READ THIS FILE FIRST BEFORE WRITING ANY CODE.
1. **NX/pnpm only** - Never use npm
2. **@platform/signature-component-library first** - Always prefer over MUI when available
3. **CSS variables for dynamic styles** - Never use function-based styles
4. **useStateUpdate for all state changes** - Uses Mutative for immutable updates
5. **Domain graph for mutations** - CRUD graph for queries only
6. **Hard-private injected services** - Use `readonly #service` pattern
7. **runWithContext for DB mutations** - Never use raw db for insert/update/delete
8. **CommonStoreProvider required** - Wrap features with provider before using hooks
9. **Use selectors for state access** - Never select entire state object
10. **CRUD graph first** - PostGraphile auto-generates from DB, use for most queries
11. **Domain graph only when needed** - Complex business rules PostGraphile can't handle
12. **Check existing patterns** - Look at NHHA API for examples
13. **Always use gql(``)** - Never use gql`` without parentheses for codegen to work

### Common GraphQL Mistakes to Avoid

1. **Creating custom resolvers too early** - Try PostGraphile CRUD first, it handles filters, ordering, pagination
2. **Querying custom resolvers through CRUD graph** - CRUD is PostGraphile auto-generated, your resolvers are in domain graph
3. **Expecting arrays from CRUD graph** - CRUD always returns connections with `nodes`, `edges`, `pageInfo`
4. **Creating resolvers for basic CRUD** - Don't! PostGraphile generates these automatically
5. **Using wrong filter type names** - CRUD uses `TableNameFilter`, not `TableNameFilterInput`
6. **Forgetting column name mapping** - Database uses snake_case (created_at), GraphQL uses camelCase (createdAt)
7. **Using gql`` without parentheses** - Always use gql(``) for TypeScript codegen to work

### DevOps & Infrastructure Rules

1. **New infrastructure first** - Use new microservice/EKS accounts for all new development
2. **Anton Babenko modules first** - Prefer terraform-aws-modules over custom modules
3. **CMK encryption everywhere** - Use Customer Managed Keys for all encryption
4. **External Secrets Operator** - Use ESO for Kubernetes secrets from AWS Secrets Manager
5. **Hierarchical tagging** - Follow `{environment}/{client}/{project}/{resource}` pattern
6. **AWS design references** - Prioritize AWS documentation over repository patterns
7. **Compliance by design** - HIPAA, SOC2, HITRUST compliance in all infrastructure
8. **ArgoCD for ALL deployments** - Never use shell scripts or direct kubectl commands for deployment
9. **Reusable modules only** - All new services must be parameterized modules in `modules/` directory

### Context Selection Guide

Choose files based on your task:

- **Building a new feature?** → Start with [React Patterns](./frontend/react-patterns.md) and [State Management](./frontend/state-management.md)
- **Creating GraphQL API?** → Read [GraphQL Architecture Guide](./graphql-architecture.md) - Use PostGraphile CRUD unless you need complex business logic
- **Managing GraphQL data in state?** → See [State Management](./frontend/state-management.md) for patterns on combining GraphQL with stores
- **Working with forms?** → Load [Form Patterns](./frontend/form-patterns.md)
- **Styling components?** → Use [CSS & Styling Patterns](./frontend/styling-patterns.md) and [MUI Usage](./frontend/mui-usage.md)
- **Writing GraphQL queries?** → Start with CRUD graph, reference [Apollo Patterns](./frontend/apollo-patterns.md)
- **Creating a service?** → Check [NestJS Patterns](./backend/nestjs-patterns.md) and [Database Patterns](./backend/database-patterns.md)
- **Writing tests?** → Follow [Testing Patterns](./backend/testing-patterns.md)
- **New Terraform module?** → Start with [Terraform Patterns](./devops/terraform-patterns.md) and [Environment Mapping](./devops/environment-mapping-patterns.md)
- **AWS service integration?** → Reference [AWS Patterns](./devops/aws-patterns.md) for service-specific patterns
- **Kubernetes workload deployment?** → Use [Kubernetes Patterns](./devops/kubernetes-patterns.md) for EKS and ArgoCD
- **CI/CD pipeline setup?** → Follow [GitHub Actions Patterns](./devops/github-actions-patterns.md)
- **Environment/account decisions?** → Check [Environment Mapping Patterns](./devops/environment-mapping-patterns.md)
- **Resource tagging?** → Follow [Tagging Patterns](./devops/tagging-patterns.md) for hierarchical tagging strategy
- **Secrets management?** → Use [Secrets Management Patterns](./devops/secrets-management-patterns.md) for AWS Secrets Manager integration
- **Security and compliance?** → Review [AWS Patterns](./devops/aws-patterns.md) for CMK and compliance patterns

## 📋 Common Tasks Checklist

### Frontend Component Creation

1. Check [Component Library Usage](./frontend/component-library.md) for component selection
2. Follow [React Patterns](./frontend/react-patterns.md) for structure
3. Apply [CSS & Styling Patterns](./frontend/styling-patterns.md) for styles
4. Use [State Management](./frontend/state-management.md) if needed

### Backend Service Creation

1. Follow [NestJS Patterns](./backend/nestjs-patterns.md) for structure
2. Apply [Database Patterns](./backend/database-patterns.md) for data access
3. Implement [GraphQL Backend](./backend/graphql-backend.md) resolvers
4. Write tests using [Testing Patterns](./backend/testing-patterns.md)

### GraphQL Operation

1. Start with CRUD graph - PostGraphile handles filters, ordering, pagination automatically
2. Only create domain resolvers if CRUD can't handle complex business rules
3. Implement queries/mutations per [Apollo Patterns](./frontend/apollo-patterns.md)
4. Handle errors and loading states properly

### Infrastructure Creation

1. Check [Environment Mapping Patterns](./devops/environment-mapping-patterns.md) for account/environment selection
2. Follow [Terraform Patterns](./devops/terraform-patterns.md) for module structure and directory placement
3. **Create reusable modules** - All services must be parameterized modules in `modules/` directory
4. Reference [AWS Patterns](./devops/aws-patterns.md) for service-specific configurations
5. Implement [Kubernetes Patterns](./devops/kubernetes-patterns.md) for workload deployment via ArgoCD
6. Apply [Tagging Patterns](./devops/tagging-patterns.md) for proper resource tagging
7. Configure [Secrets Management Patterns](./devops/secrets-management-patterns.md) for secure secret handling
8. Set up [GitHub Actions Patterns](./devops/github-actions-patterns.md) for CI/CD automation

---

**Note**: This modular approach helps AI agents load only the specific context needed for each task, reducing token usage and improving relevance.

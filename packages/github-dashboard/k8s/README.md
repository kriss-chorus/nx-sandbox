# GitHub Dashboard - Kubernetes Setup

This directory contains Kubernetes manifests for the GitHub Dashboard application, migrated from Docker Compose to Kubernetes orchestration.

## 🏗️ Architecture

The application consists of 3 main services:

1. **PostgreSQL Database** - Data persistence layer
2. **GitHub Dashboard API** - NestJS backend service with embedded PostGraphile
3. **GitHub Dashboard Web** - React frontend service

## 📁 File Structure

```
k8s/
├── 01-namespace.yaml                    # Kubernetes namespace
├── 02-postgres-configmap.yaml          # PostgreSQL configuration
├── 02-postgres-init-sql-configmap.yaml # Database initialization scripts
├── 03-postgres-pvc.yaml                # Persistent volume claim for data
├── 04-postgres-deployment.yaml         # PostgreSQL deployment
├── 05-postgres-service.yaml            # PostgreSQL service
├── 09-api-configmap.yaml               # API configuration
├── 10-api-deployment.yaml              # API deployment (with embedded PostGraphile)
├── 11-api-service.yaml                 # API service
├── 12-web-configmap.yaml               # Web configuration
├── 13-web-deployment.yaml              # Web deployment
├── 14-web-service.yaml                 # Web service
├── 15-db-migrate-job.yaml              # Database migration job
└── README.md                           # This file
```

## 🚀 Quick Start

### Prerequisites

- Kubernetes cluster (local: minikube, kind, or Docker Desktop)
- Tilt installed
- Docker installed

### Running the Application

1. **Start Tilt**:
   ```bash
   pnpm run tilt:up:github-dashboard
   ```

2. **Access the Application**:
   - **Web App**: http://localhost:8080
   - **API**: http://localhost:3001/api
   - **PostGraphile GraphQL**: http://localhost:3001/graphql
   - **PostGraphile GraphiQL**: http://localhost:3001/graphiql

3. **Stop the Application**:
   ```bash
   pnpm run tilt:down
   ```

## 🔧 Configuration

### Environment Variables

Each service has its own ConfigMap with environment-specific variables:

- **PostgreSQL**: Database credentials and configuration
- **API**: Database URL, port, and environment settings (includes PostGraphile config)
- **Web**: API endpoint configuration

### Port Forwarding

Tilt automatically sets up port forwarding:
- `5432` → PostgreSQL
- `3001` → API (includes PostGraphile GraphQL endpoints)
- `8080` → Web

### Resource Limits

All services have resource requests and limits configured:
- **CPU**: 50m-500m requests, 200m-500m limits
- **Memory**: 128Mi-256Mi requests, 256Mi-512Mi limits

## 🗄️ Database

### Persistent Storage

PostgreSQL data is persisted using a PersistentVolumeClaim:
- **Size**: 10Gi
- **Access Mode**: ReadWriteOnce
- **Storage Class**: standard

### Initialization

Database initialization is handled by:
1. ConfigMap with init.sql script
2. Mounted as volume in PostgreSQL deployment
3. Executed automatically on first startup

### Migrations

Database migrations are handled by a Kubernetes Job:
- Runs after API deployment
- Uses the same API image
- Executes `npm run db:migrate`
- Manual trigger via Tilt

## 🔍 Monitoring and Debugging

### Useful Commands

```bash
# View all resources
kubectl get all -n github-dashboard

# Check pod logs
kubectl logs -f deployment/postgres-deployment -n github-dashboard
kubectl logs -f deployment/api-deployment -n github-dashboard
kubectl logs -f deployment/web-deployment -n github-dashboard

# Describe resources for debugging
kubectl describe pod <pod-name> -n github-dashboard

# Port forward manually (if needed)
kubectl port-forward service/web-service 8080:80 -n github-dashboard
```

### Health Checks

All services have health checks configured:
- **Liveness Probes**: Ensure containers are running
- **Readiness Probes**: Ensure containers are ready to serve traffic

## 🔒 Security

### Network Policies

Currently using default Kubernetes networking. For production, consider:
- NetworkPolicies for service isolation
- Pod Security Standards
- RBAC for service accounts

### Secrets Management

For production, replace hardcoded passwords with:
- Kubernetes Secrets
- External Secrets Operator
- HashiCorp Vault integration

## 🚀 Production Considerations

### Scaling

- **Horizontal Pod Autoscaler (HPA)** for automatic scaling
- **Vertical Pod Autoscaler (VPA)** for resource optimization
- **Cluster Autoscaler** for node scaling

### Monitoring

- **Prometheus** for metrics collection
- **Grafana** for visualization
- **Jaeger** for distributed tracing

### CI/CD

- **ArgoCD** for GitOps deployments
- **Tekton** for CI/CD pipelines
- **Helm** for package management

## 🔄 Migration Notes

This setup was migrated from Docker Compose to Kubernetes with PostGraphile embedded in the API. Key changes:

1. **Service Discovery**: Services communicate via DNS names
2. **Configuration**: Environment variables moved to ConfigMaps
3. **Storage**: Docker volumes replaced with PersistentVolumeClaims
4. **Networking**: Docker networking replaced with Kubernetes services
5. **Orchestration**: Docker Compose replaced with Kubernetes deployments
6. **PostGraphile Integration**: PostGraphile is now embedded within the NestJS API service instead of running as a separate service

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Tilt Documentation](https://docs.tilt.dev/)
- [PostGraphile Documentation](https://www.graphile.org/postgraphile/)
- [NestJS Documentation](https://nestjs.com/)
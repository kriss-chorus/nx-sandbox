# Journey: Kubernetes Migration - Docker Compose to K8s: From Docker Compose to K8s with Tilt

## 📋 Project Overview
**Project**: GitHub Dashboard  
**Date**: January 2025  
**Goal**: Migrate from Docker Compose + local processes to full Kubernetes orchestration with Tilt

## 🎯 Initial State Analysis

### Current Architecture (Before Migration)
- **Database**: PostgreSQL 15 + PostGraphile via Docker Compose
- **API**: NestJS application running locally via `npx nx serve api`
- **Web**: React + Vite application running locally via `npx nx serve web`
- **Orchestration**: Tilt managing Docker Compose + local processes
- **Ports**: 
  - PostgreSQL: 5432
  - PostGraphile: 5001
  - API: 3001
  - Web: 4202

### Services Identified
1. **PostgreSQL Database** - Data persistence
2. **PostGraphile** - GraphQL API layer
3. **GitHub Dashboard API** - NestJS backend
4. **GitHub Dashboard Web** - React frontend

## 🚀 Migration Steps

### Step 1: Analysis and Planning ✅
- [x] Analyzed current Docker Compose configuration
- [x] Reviewed existing Dockerfiles (API and Web already containerized)
- [x] Identified service dependencies and networking requirements
- [x] Planned Kubernetes resource structure

### Step 2: Create Kubernetes Manifests ✅
- [x] PostgreSQL Deployment + Service + PVC
- [x] PostGraphile Deployment + Service
- [x] API Deployment + Service
- [x] Web Deployment + Service
- [x] ConfigMaps for environment variables
- [x] Database initialization ConfigMap
- [x] Migration Job for database setup

### Step 3: Update Tiltfile ✅
- [x] Replace `docker_compose()` with `k8s_yaml()`
- [x] Replace `local_resource()` with Kubernetes deployments
- [x] Update service dependencies
- [x] Configure port forwarding
- [x] Add Docker image building
- [x] Create migration job

### Step 4: Testing and Validation 🔄
- [ ] Test individual service deployments
- [ ] Verify service-to-service communication
- [ ] Test database migrations
- [ ] Validate frontend-backend integration

## 📚 Learning Notes

### Key Concepts Learned

#### 1. Tilt's Kubernetes Integration
- Tilt can manage both Docker Compose AND Kubernetes
- `k8s_yaml()` function loads Kubernetes manifests
- `k8s_resource()` provides fine-grained control over deployments
- Port forwarding is handled automatically by Tilt

#### 2. Service Dependencies in K8s
- Unlike Docker Compose's `depends_on`, K8s uses readiness/liveness probes
- Services communicate via DNS names (e.g., `postgres-service:5432`)
- Init containers can be used for setup tasks like migrations

#### 3. Configuration Management
- ConfigMaps for non-sensitive configuration
- Secrets for sensitive data (database passwords, API keys)
- Environment variables injected into containers

#### 4. Networking in Kubernetes
- Services provide stable DNS names and load balancing
- ClusterIP for internal communication
- NodePort/LoadBalancer for external access
- Ingress for HTTP/HTTPS routing

### Challenges Encountered

#### 1. Service Discovery
**Problem**: Services need to communicate using K8s service names  
**Solution**: Update connection strings to use service DNS names

#### 2. Database Initialization
**Problem**: PostgreSQL needs initialization scripts  
**Solution**: Use ConfigMap for init.sql and mount as volume

#### 3. Environment Variables
**Problem**: Different services need different environment configurations  
**Solution**: Create separate ConfigMaps per service

#### 4. Port Management
**Problem**: Tilt needs to know which ports to forward  
**Solution**: Use `port_forward()` in Tiltfile for external access

## 🏗️ Architecture Decisions

### 1. Namespace Strategy
- **Decision**: Use single namespace `github-dashboard`
- **Rationale**: Simple setup for development, can be multi-namespace in production

### 2. Storage Strategy
- **Decision**: Use PersistentVolumeClaim for PostgreSQL data
- **Rationale**: Data persistence across pod restarts

### 3. Service Types
- **Decision**: ClusterIP for internal services, NodePort for external access
- **Rationale**: Secure internal communication, accessible from host for development

### 4. Configuration Management
- **Decision**: ConfigMaps for non-sensitive data, hardcoded secrets for dev
- **Rationale**: Simple setup, can use External Secrets Operator in production

## 🔧 Technical Implementation

### Kubernetes Resources Created

#### 1. PostgreSQL
```yaml
- Deployment: postgres-deployment
- Service: postgres-service
- PersistentVolumeClaim: postgres-pvc
- ConfigMap: postgres-config
```

#### 2. PostGraphile
```yaml
- Deployment: postgraphile-deployment
- Service: postgraphile-service
- ConfigMap: postgraphile-config
```

#### 3. API
```yaml
- Deployment: api-deployment
- Service: api-service
- ConfigMap: api-config
```

#### 4. Web
```yaml
- Deployment: web-deployment
- Service: web-service
- ConfigMap: web-config
```

### Tiltfile Changes
- Replaced `docker_compose()` with `k8s_yaml()`
- Added `port_forward()` for external access
- Configured service dependencies via `resource_deps`

## ✅ Best Practices Established

### 1. Development Workflow
- **Hot Reloading**: Use Tilt's live update capabilities
- **Port Forwarding**: Automatic port forwarding for local development
- **Service Dependencies**: Clear dependency chain in Tiltfile

### 2. Kubernetes Best Practices
- **Resource Limits**: Set CPU/memory requests and limits
- **Health Checks**: Implement readiness and liveness probes
- **Security**: Use non-root users, read-only root filesystem
- **Networking**: Use NetworkPolicies for service isolation

### 3. Configuration Management
- **Environment Separation**: Different ConfigMaps per environment
- **Secret Management**: Use Kubernetes Secrets for sensitive data
- **Configuration Updates**: Rolling updates for ConfigMap changes

### 4. Monitoring and Debugging
- **Logging**: Centralized logging with structured logs
- **Metrics**: Expose Prometheus metrics endpoints
- **Debugging**: Use `kubectl` commands for troubleshooting

## 🚨 Common Pitfalls and Solutions

### 1. Service DNS Resolution
**Pitfall**: Services can't reach each other  
**Solution**: Use full service names: `service-name.namespace.svc.cluster.local`

### 2. Port Configuration
**Pitfall**: Wrong ports in service definitions  
**Solution**: Match container ports with service ports

### 3. Environment Variables
**Pitfall**: Missing or incorrect environment variables  
**Solution**: Validate all required env vars are set in ConfigMaps

### 4. Database Connections
**Pitfall**: Database connection strings using localhost  
**Solution**: Use Kubernetes service names in connection strings

## 📈 Performance Considerations

### 1. Resource Allocation
- **CPU**: Start with 100m requests, 500m limits
- **Memory**: Start with 256Mi requests, 512Mi limits
- **Storage**: Use appropriate storage classes for PVCs

### 2. Scaling Strategy
- **Horizontal**: Use HPA for automatic scaling
- **Vertical**: Monitor resource usage and adjust limits

### 3. Network Optimization
- **Service Mesh**: Consider Istio for advanced networking
- **Load Balancing**: Use service load balancing for high availability

## 🔮 Future Improvements

### 1. Production Readiness
- [ ] Implement proper secret management (External Secrets Operator)
- [ ] Add monitoring and alerting (Prometheus + Grafana)
- [ ] Implement backup strategies for PostgreSQL
- [ ] Add network policies for security

### 2. CI/CD Integration
- [ ] Automated testing in Kubernetes environment
- [ ] Blue-green deployments
- [ ] Canary releases with Argo Rollouts

### 3. Advanced Features
- [ ] Service mesh integration (Istio)
- [ ] Multi-environment support
- [ ] GitOps with ArgoCD
- [ ] Advanced monitoring and observability

## 📝 Commands Reference

### Useful kubectl Commands
```bash
# View all resources
kubectl get all -n github-dashboard

# Check pod logs
kubectl logs -f deployment/api-deployment -n github-dashboard

# Port forward for testing
kubectl port-forward service/web-service 8080:80 -n github-dashboard

# Describe resources for debugging
kubectl describe pod <pod-name> -n github-dashboard
```

### Tilt Commands
```bash
# Start the development environment
tilt up

# View logs
tilt logs

# Stop the environment
tilt down
```

## 🎉 Conclusion

This migration successfully transformed a Docker Compose + local processes setup into a full Kubernetes orchestration with Tilt. The key benefits achieved:

1. **Consistency**: Same environment locally and in production
2. **Scalability**: Easy horizontal scaling of services
3. **Observability**: Better monitoring and debugging capabilities
4. **Security**: Network policies and security contexts
5. **Maintainability**: Declarative configuration management

The journey provided valuable insights into Kubernetes concepts, Tilt's capabilities, and modern container orchestration practices.

---

**Next Steps**: Consider implementing the future improvements listed above to make this setup production-ready.

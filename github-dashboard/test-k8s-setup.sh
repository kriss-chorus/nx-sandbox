#!/bin/bash

# GitHub Dashboard Kubernetes Setup Test Script
# This script helps test the Kubernetes migration

echo "🚀 Testing GitHub Dashboard Kubernetes Setup"
echo "=============================================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if tilt is available
if ! command -v tilt &> /dev/null; then
    echo "❌ tilt is not installed or not in PATH"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Function to check if namespace exists
check_namespace() {
    if kubectl get namespace github-dashboard &> /dev/null; then
        echo "✅ Namespace 'github-dashboard' exists"
        return 0
    else
        echo "❌ Namespace 'github-dashboard' does not exist"
        return 1
    fi
}

# Function to check if all pods are running
check_pods() {
    local namespace="github-dashboard"
    local running_pods=$(kubectl get pods -n $namespace --field-selector=status.phase=Running --no-headers | wc -l)
    local total_pods=$(kubectl get pods -n $namespace --no-headers | wc -l)
    
    echo "📊 Pod Status: $running_pods/$total_pods pods running"
    
    if [ $running_pods -eq $total_pods ] && [ $total_pods -gt 0 ]; then
        echo "✅ All pods are running"
        return 0
    else
        echo "❌ Not all pods are running"
        kubectl get pods -n $namespace
        return 1
    fi
}

# Function to check services
check_services() {
    local namespace="github-dashboard"
    local services=$(kubectl get services -n $namespace --no-headers | wc -l)
    
    echo "📊 Services: $services services found"
    kubectl get services -n $namespace
    
    if [ $services -ge 4 ]; then
        echo "✅ Expected services are present"
        return 0
    else
        echo "❌ Missing expected services"
        return 1
    fi
}

# Function to test port forwarding
test_port_forwarding() {
    echo "🔌 Testing port forwarding..."
    
    # Test web service
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|404"; then
        echo "✅ Web service accessible on port 8080"
    else
        echo "❌ Web service not accessible on port 8080"
    fi
    
    # Test API service
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api | grep -q "200\|404"; then
        echo "✅ API service accessible on port 3001"
    else
        echo "❌ API service not accessible on port 3001"
    fi
    
    # Test PostGraphile service
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/graphql | grep -q "200\|400"; then
        echo "✅ PostGraphile service accessible on port 5001"
    else
        echo "❌ PostGraphile service not accessible on port 5001"
    fi
}

# Main test execution
echo ""
echo "🔍 Running Kubernetes setup tests..."
echo ""

# Check namespace
if ! check_namespace; then
    echo "💡 Try running: tilt up"
    exit 1
fi

# Check pods
if ! check_pods; then
    echo "💡 Wait for pods to start or check: kubectl get pods -n github-dashboard"
    exit 1
fi

# Check services
if ! check_services; then
    echo "💡 Check service definitions"
    exit 1
fi

# Test port forwarding
test_port_forwarding

echo ""
echo "🎉 Kubernetes setup test completed!"
echo ""
echo "📋 Access URLs:"
echo "   Web App: http://localhost:8080"
echo "   API: http://localhost:3001/api"
echo "   PostGraphile GraphQL: http://localhost:5001/graphql"
echo "   PostGraphile GraphiQL: http://localhost:5001/graphiql"
echo ""
echo "🔧 Useful commands:"
echo "   kubectl get all -n github-dashboard"
echo "   tilt logs"
echo "   tilt down"

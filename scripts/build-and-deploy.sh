#!/bin/bash

DOCKER_USER="grabekd"

echo "Building Docker images..."
docker build -t ${DOCKER_USER}/taskmanager-backend:latest ./backend
docker build -t ${DOCKER_USER}/taskmanager-frontend:latest ./frontend

echo "Pushing images to Docker Hub..."
docker push ${DOCKER_USER}/taskmanager-backend:latest
docker push ${DOCKER_USER}/taskmanager-frontend:latest

# Apply manifests
echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
sleep 2s

kubectl apply -f k8s/app/
kubectl apply -f k8s/monitoring/

echo "Waiting for deployments..."
kubectl rollout restart deployment/backend -n taskmanager || true
kubectl rollout restart deployment/frontend -n taskmanager || true
kubectl wait --namespace=monitoring --for=condition=available --timeout=300s deployment/prometheus || true
kubectl wait --namespace=monitoring --for=condition=available --timeout=300s deployment/grafana || true

echo "Services info:"
kubectl get services -n taskmanager
kubectl get services -n monitoring

echo ""
echo "🎯 Access your monitoring services:"
echo "📊 Grafana: http://$(kubectl get svc grafana-service -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'):3000 (admin/admin123)"
echo "🔍 Prometheus: http://$(kubectl get svc prometheus-service -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'):9090"

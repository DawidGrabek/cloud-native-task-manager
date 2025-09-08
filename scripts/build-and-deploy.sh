#!/bin/bash

echo "Building Docker images..."
docker build -t taskmanager-backend:latest ./backend
docker build -t taskmanager-frontend:latest ./frontend

echo "Importing images to k3s..."
docker save taskmanager-backend:latest -o backend.tar
sudo k3s ctr images import backend.tar
docker save taskmanager-frontend:latest -o frontend.tar
sudo k3s ctr images import frontend.tar
rm backend.tar frontend.tar

# Apply manifests
echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
sleep 2s

kubectl apply -f k8s/

echo "Waiting for deployments..."
kubectl wait --namespace=taskmanager --for=condition=available --timeout=300s deployment/backend || true
kubectl wait --namespace=taskmanager --for=condition=available --timeout=300s deployment/frontend || true
kubectl wait --namespace=monitoring --for=condition=available --timeout=300s deployment/prometheus || true
kubectl wait --namespace=monitoring --for=condition=available --timeout=300s deployment/grafana || true

echo "Services info:"
kubectl get services -n taskmanager
kubectl get services -n monitoring

echo ""
echo "🎯 Access your monitoring services:"
echo "📊 Grafana: http://$(kubectl get svc grafana-service -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):3000 (admin/admin123)"
echo "🔍 Prometheus: http://$(kubectl get svc prometheus-service -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):9090"

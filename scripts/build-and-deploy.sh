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
kubectl rollout restart deployment/backend -n taskmanager || true
kubectl rollout restart deployment/frontend -n taskmanager || true
# kubectl wait --namespace=taskmanager --for=condition=available --timeout=300s deployment/backend || true
# kubectl wait --namespace=taskmanager --for=condition=available --timeout=300s deployment/frontend || true
kubectl wait --namespace=monitoring --for=condition=available --timeout=300s deployment/prometheus || true
kubectl wait --namespace=monitoring --for=condition=available --timeout=300s deployment/grafana || true

echo "Services info:"
kubectl get services -n taskmanager
kubectl get services -n monitoring

echo ""
echo "🎯 Access your monitoring services:"
echo "📊 Grafana: http://$(kubectl get svc grafana-service -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):3000 (admin/admin123)"
echo "🔍 Prometheus: http://$(kubectl get svc prometheus-service -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):9090"


#!/bin/bash
# set -euo pipefail

# echo "Building Docker images..."
# docker build -t taskmanager-backend:latest ./backend
# docker build -t taskmanager-frontend:latest ./frontend

# CTX="$(kubectl config current-context 2>/dev/null || true)"

# case "$CTX" in
#   docker-desktop)
#     echo "Docker Desktop K8s detected — skipping image import"
#     ;;
#   kind*|Kind*|KIND*)
#     echo "kind detected — importing local images"
#     kind load docker-image taskmanager-backend:latest
#     kind load docker-image taskmanager-frontend:latest
#     ;;
#   minikube)
#     echo "minikube detected — importing local images"
#     minikube image load taskmanager-backend:latest
#     minikube image load taskmanager-frontend:latest
#     ;;
#   k3d*|K3D*)
#     echo "k3d detected — importing local images"
#     k3d image import taskmanager-backend:latest
#     k3d image import taskmanager-frontend:latest
#     ;;
#   *)
#     echo "Unknown K8s context ($CTX) — ensure nodes mogą pobrać obrazy z rejestru lub dodaj tu swoją ścieżkę importu"
#     ;;
# esac

# echo "Applying Kubernetes manifests..."
# kubectl apply -f k8s/namespace.yaml
# sleep 2s
# kubectl apply -f k8s/

# echo "Waiting for deployments..."
# kubectl wait --namespace=taskmanager --for=condition=available --timeout=300s deployment/backend || true
# kubectl wait --namespace=taskmanager --for=condition=available --timeout=300s deployment/frontend || true
# kubectl wait --namespace=monitoring --for=condition=available --timeout=300s deployment/prometheus || true
# kubectl wait --namespace=monitoring --for=condition=available --timeout=300s deployment/grafana || true

# echo "Services info:"
# kubectl get services -n taskmanager
# kubectl get services -n monitoring

# GRAFANA_HOST="$(kubectl get svc grafana-service -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}{.status.loadBalancer.ingress[0].hostname}')"
# PROM_HOST="$(kubectl get svc prometheus-service -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}{.status.loadBalancer.ingress[0].hostname}')"

# echo ""
# echo "🎯 Access your monitoring services:"
# echo "📊 Grafana: http://${GRAFANA_HOST:-localhost}:3000 (admin/admin123)"
# echo "🔍 Prometheus: http://${PROM_HOST:-localhost}:9090"

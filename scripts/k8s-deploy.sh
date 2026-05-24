#!/bin/bash
# Goal: Applies configurations from the k8s directory to the Kubernetes cluster
# When to use: Upon first Kubernetes setup, or when modifying YAML files in the k8s/ directory.

set -e

echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
sleep 2s

kubectl apply -f k8s/app/
kubectl apply -f k8s/monitoring/

echo "Waiting for deployments to roll out (forcing new image pull)..."
kubectl rollout restart deployment/backend -n taskmanager || true
kubectl rollout restart deployment/frontend -n taskmanager || true
kubectl wait --namespace=monitoring --for=condition=available --timeout=300s deployment/prometheus || true
kubectl wait --namespace=monitoring --for=condition=available --timeout=300s deployment/grafana || true

echo "Services info (connection details):"
kubectl get services -n taskmanager
kubectl get services -n monitoring

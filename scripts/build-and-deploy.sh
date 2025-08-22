#!/bin/bash

# Build images
docker build -t taskmanager-backend:latest ./backend
docker build -t taskmanager-frontend:latest ./frontend

# Import images to k3s (poprawka zamiast <(...))
docker save taskmanager-backend:latest -o backend.tar
sudo k3s ctr images import backend.tar
docker save taskmanager-frontend:latest -o frontend.tar
sudo k3s ctr images import frontend.tar
rm backend.tar frontend.tar

# Apply manifests
kubectl apply -f k8s/namespace.yaml
sleep 2s

kubectl apply -f k8s/

kubectl wait --namespace=taskmanager --for=condition=available --timeout=300s deployment/backend
kubectl wait --namespace=taskmanager --for=condition=available --timeout=300s deployment/frontend

kubectl get services -n taskmanager
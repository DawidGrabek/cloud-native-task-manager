#!/bin/bash
# Goal: Removes the entire application environment from the Kubernetes cluster
# When to use: When you want to shut down K8s and return to using 'docker compose', or reset the application state.

echo "Deleting K8s environment..."
kubectl delete namespace taskmanager monitoring
echo "Cluster cleaned! Ports are now free, you can safely run 'docker compose up -d'."

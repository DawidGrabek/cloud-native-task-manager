#!/bin/bash

# Using: ./reload-k8s-image.sh [frontend|backend]

set -e

SERVICE="$1"
if [ -z "$SERVICE" ]; then
  echo "Give parametr: frontend or backend"
  exit 1
fi

DOCKER_USER="grabekd"
IMAGE="${DOCKER_USER}/taskmanager-$SERVICE:latest"
DIR="./$SERVICE"

# Build image
docker build -t "$IMAGE" "$DIR"

# Push to Docker Hub
echo "Pushing image to Docker Hub..."
docker push "$IMAGE"

# Restart deployment in kubernetes
kubectl rollout restart deployment/"$SERVICE" -n taskmanager

echo "✅ Image $IMAGE has been rebuild, imported and deployment/$SERVICE has been restarted"

#!/bin/bash

# Using: ./reload-k8s-image.sh [frontend|backend]

set -e

SERVICE="$1"
if [ -z "$SERVICE" ]; then
  echo "Podaj parametr: frontend lub backend"
  exit 1
fi

IMAGE="taskmanager-$SERVICE:latest"
DIR="./$SERVICE"

# Build image
docker build -t "$IMAGE" "$DIR"

# Save and import into k3s (containerd)
docker save -o "$SERVICE.tar" "$IMAGE"
sudo k3s ctr images import "$SERVICE.tar"
rm "$SERVICE.tar"

# Restart deployment in kubernetes
kubectl rollout restart deployment/"$SERVICE" -n taskmanager

echo "✅ Image $IMAGE has been rebuild, imported and deployment/$SERVICE has been restarted"

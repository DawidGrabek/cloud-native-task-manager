#!/bin/bash
# Goal: Builds application images and pushes them to Docker Hub
# When to use: After finishing a feature, when you want to update the codebase for Kubernetes.

set -e
DOCKER_USER="grabekd"

echo "Building images..."
docker build -t ${DOCKER_USER}/taskmanager-backend:latest ./backend
docker build -t ${DOCKER_USER}/taskmanager-frontend:latest ./frontend

echo "Pushing images to Docker Hub..."
docker push ${DOCKER_USER}/taskmanager-backend:latest
docker push ${DOCKER_USER}/taskmanager-frontend:latest

echo "Images are successfully pushed to the registry!"

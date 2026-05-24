#!/bin/bash
# Goal: Quick preview of all configuration files in the k8s/ directory
# When to use: When you want to review Kubernetes object definitions without opening a code editor.

echo "Browsing the k8s/ directory (including subdirectories)..."
echo "================================================="

find ./k8s -name "*.yaml" -type f | while read -r item; do
    echo "### File: $item ###"
    echo "--- Content ---"
    cat "$item"
    echo "-----------------------------------------------------"
    echo ""
done

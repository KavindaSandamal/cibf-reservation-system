#!/bin/bash

# -----------------------------
# Deploy CIBF Services on EC2
# -----------------------------

set -e  # Exit if any command fails

# Optional: change this to your project directory
PROJECT_DIR=~/cibf-reservation-system
cd $PROJECT_DIR || { echo "❌ Project directory not found!"; exit 1; }

# Docker image repository (Docker Hub or AWS ECR)
DOCKER_REPO=kavindasandamal

# Service list
SERVICES=(
  "authentication-service"
  "stall-service"
  "user-service"
  "reservation-service"
)

echo "🚀 Deploying CIBF Services..."
echo "📂 Project directory: $PROJECT_DIR"

# Pull latest code (optional, for git-based configs)
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing services..."
docker-compose down

# Pull pre-built Docker images
echo "📥 Pulling pre-built Docker images..."
for SERVICE in "${SERVICES[@]}"; do
    IMAGE_NAME="$DOCKER_REPO/$SERVICE:latest"
    echo "🔄 Pulling $IMAGE_NAME ..."
    docker pull $IMAGE_NAME
done

# Start services
echo "▶️  Starting services..."
docker-compose up -d

# Show status of containers
echo "✅ Deployment complete! Current status:"
docker-compose ps

# Show last 50 lines of logs for all services
echo "📋 Recent logs:"
docker-compose logs --tail=50

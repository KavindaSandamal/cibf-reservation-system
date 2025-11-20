#!/bin/bash

# -----------------------------
# Deploy CIBF Services on EC2
# -----------------------------

set -e  # Exit if any command fails

# -----------------------------
# Configuration
# -----------------------------
PROJECT_DIR=~/cibf-reservation-system
DOCKER_REPO=kavindasandamal

# Services list (must match docker-compose service names)
SERVICES=(
  "rabbitmq"
  "auth-service"
  "stall-service"
  "user-service"
  "reservation-service"
  "nginx"
)

# -----------------------------
# Change to project directory
# -----------------------------
cd "$PROJECT_DIR" || { echo "❌ Project directory not found!"; exit 1; }
echo "📂 Project directory: $PROJECT_DIR"

# -----------------------------
# Pull latest code
# -----------------------------
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# -----------------------------
# Stop existing containers
# -----------------------------
echo "🛑 Stopping existing services..."
docker-compose down

# -----------------------------
# Detect available memory (MB)
# -----------------------------
TOTAL_MEM_MB=$(free -m | awk '/^Mem:/ {print $7}') # available memory
echo "💾 Available memory: ${TOTAL_MEM_MB} MB"

# Use 70% of available memory for containers
MEM_LIMIT_MB=$((TOTAL_MEM_MB * 70 / 100))
echo "⚖️ Setting max memory per container: ${MEM_LIMIT_MB} MB"

# -----------------------------
# Export memory limits as environment variables
# -----------------------------
export MEM_LIMIT_MB

# -----------------------------
# Pull Docker images
# -----------------------------
echo "📥 Pulling pre-built Docker images..."
for SERVICE in "${SERVICES[@]}"; do
    IMAGE_NAME="$DOCKER_REPO/$SERVICE:latest"
    echo "🔄 Pulling $IMAGE_NAME ..."
    docker pull "$IMAGE_NAME" || echo "⚠️ Failed to pull $IMAGE_NAME"
done

# -----------------------------
# Start services using docker-compose with memory limits
# -----------------------------
echo "▶️  Starting services with memory limits..."
docker-compose up -d

# -----------------------------
# Deployment summary
# -----------------------------
echo "✅ Deployment complete! Current status:"
docker-compose ps

echo "📋 Last 50 lines of logs for all services:"
docker-compose logs --tail=50

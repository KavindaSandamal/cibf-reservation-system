

echo "🚀 Deploying CIBF Services..."

cd ~/cibf-reservation-system

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing services..."
docker-compose down

# Build images
echo "🔨 Building Docker images..."
docker-compose build

# Start services
echo "▶️  Starting services..."
docker-compose up -d

# Show status
echo "✅ Deployment complete!"
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=50

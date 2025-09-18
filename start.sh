#!/bin/bash

echo "Flying Dog Inn VTT - Starting Application"
echo "========================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo ""
    echo "Please run './setup-tunnel.sh' first to configure your Cloudflare tunnel,"
    echo "or create a .env file manually based on env.example"
    echo ""
    exit 1
fi

# Load environment variables
source .env

echo "🔧 Configuration:"
echo "   Tunnel URL: ${TUNNEL_URL:-Not set}"
echo "   Environment: ${NODE_ENV:-development}"
echo ""

# Check if tunnel configuration exists
if [ ! -f "./cloudflared/config.yml" ]; then
    echo "⚠️  Cloudflare tunnel not configured!"
    echo "Please run './setup-tunnel.sh' to configure your tunnel"
    echo ""
    exit 1
fi

# Check if tunnel credentials exist
TUNNEL_ID=$(grep "tunnel:" ./cloudflared/config.yml | awk '{print $2}')
if [ ! -f "./cloudflared/$TUNNEL_ID.json" ]; then
    echo "⚠️  Tunnel credentials not found!"
    echo "Please run './setup-tunnel.sh' to configure your tunnel"
    echo ""
    exit 1
fi

echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Application started!"
echo ""
if [ ! -z "$TUNNEL_URL" ]; then
    echo "🌐 Your VTT is available at: $TUNNEL_URL"
else
    echo "🌐 Your VTT is available at: http://localhost (via tunnel)"
fi
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop app:      docker-compose down"
echo "   Restart:       docker-compose restart"
echo "   Status:        docker-compose ps"

#!/bin/bash

echo "Flying Dog Inn VTT - Cloudflare Tunnel Setup (Containerized)"
echo "=========================================================="

# Check if cloudflared is installed (needed for setup only)
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared for initial setup..."
    
    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install cloudflared
        else
            echo "Please install Homebrew first, then run: brew install cloudflared"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb
        rm cloudflared-linux-amd64.deb
    else
        echo "Please install cloudflared manually for your OS"
        echo "Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        exit 1
    fi
fi

echo "Cloudflared available for setup!"

# Check for existing certificate
echo ""
echo "Step 1: Checking for existing Cloudflare certificate..."
if [ -f ~/.cloudflared/cert.pem ]; then
    echo "✅ Found existing Cloudflare certificate"
    cp ~/.cloudflared/cert.pem ./cloudflared/
    echo "Certificate copied to project directory"
else
    echo "No existing certificate found. Logging in to Cloudflare..."
    echo "This will open a browser window for authentication..."
    cloudflared tunnel login
    
    # Copy certificate to project directory
    if [ -f ~/.cloudflared/cert.pem ]; then
        cp ~/.cloudflared/cert.pem ./cloudflared/
        echo "Certificate copied to project directory"
    else
        echo "❌ Failed to obtain certificate"
        exit 1
    fi
fi

# Create tunnel
echo ""
echo "Step 2: Create tunnel"
read -p "Enter a name for your tunnel (e.g., flying-dog-inn-vtt): " TUNNEL_NAME

if [ -z "$TUNNEL_NAME" ]; then
    TUNNEL_NAME="flying-dog-inn-vtt"
fi

cloudflared tunnel create $TUNNEL_NAME

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')
echo "Tunnel ID: $TUNNEL_ID"

# Create config file
echo ""
echo "Step 3: Creating tunnel configuration..."
read -p "Enter your domain (e.g., vtt.yourdomain.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "Domain is required!"
    exit 1
fi

# Copy tunnel credentials to project directory
if [ -f ~/.cloudflared/$TUNNEL_ID.json ]; then
    cp ~/.cloudflared/$TUNNEL_ID.json ./cloudflared/
    echo "Tunnel credentials copied to project directory"
else
    echo "❌ Tunnel credentials not found"
    exit 1
fi

# Create cloudflared config for the container
cat > ./cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /etc/cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $DOMAIN
    service: http://nginx:80
  - service: http_status:404
EOF

echo "Configuration created at ./cloudflared/config.yml"

# Create .env file
echo ""
echo "Step 4: Creating environment file..."
cat > .env << EOF
# Your tunnel URL
TUNNEL_URL=https://$DOMAIN
TUNNEL_WS_URL=wss://$DOMAIN

# Environment
NODE_ENV=production

# Note: Cloudflare tunnel configuration is handled via files in ./cloudflared/ directory
EOF

echo "Environment file created!"

# Create DNS record
echo ""
echo "Step 5: Creating DNS record..."
echo "Creating CNAME record for $DOMAIN..."
cloudflared tunnel route dns $TUNNEL_NAME $DOMAIN

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Your tunnel is now configured:"
echo "- Tunnel Name: $TUNNEL_NAME"
echo "- Tunnel ID: $TUNNEL_ID"
echo "- Domain: https://$DOMAIN"
echo "- Configuration: ./cloudflared/config.yml"
echo "- Credentials: ./cloudflared/$TUNNEL_ID.json"
echo ""
echo "✅ All tunnel files are now in the ./cloudflared/ directory"
echo "✅ This project can be copied to any machine with Docker"
echo ""
echo "To start your application:"
echo "1. ./start.sh"
echo "   or"
echo "2. docker-compose up -d"
echo ""
echo "Your VTT will be available at: https://$DOMAIN"
echo ""
echo "📋 For deployment on another machine:"
echo "1. Copy the entire project directory (including ./cloudflared/)"
echo "2. Run: docker-compose up -d"
echo "3. No additional setup required!"
echo ""
echo "Note: Make sure your domain is pointed to Cloudflare's nameservers"
echo "and that you have the appropriate permissions in your Cloudflare account."

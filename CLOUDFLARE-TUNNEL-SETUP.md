# Flying Dog Inn VTT - Cloudflare Tunnel Setup (Containerized)

This guide will help you set up a **fully containerized** Cloudflare tunnel for your Flying Dog Inn VTT application, making it portable across any machine with Docker and accessible via a custom domain with HTTPS.

## Prerequisites

1. A Cloudflare account
2. A domain managed by Cloudflare
3. Docker and Docker Compose installed
4. Access to your domain's DNS settings in Cloudflare

## Key Features

✅ **Fully Containerized**: Tunnel runs inside Docker - no host dependencies  
✅ **Portable**: Copy project to any machine and run with `docker-compose up -d`  
✅ **Secure**: All credentials stored in project directory  
✅ **Easy Setup**: One script configures everything

## Quick Setup (Automated)

Run the automated setup script:

```bash
./setup-tunnel.sh
```

This script will:
1. Use existing Cloudflare certificate or help you authenticate
2. Create a tunnel
3. Copy all tunnel configuration files to `./cloudflared/` directory
4. Configure DNS
5. Create a `.env` file with your domain configuration

**The tunnel runs completely in Docker** - no host installation required after setup!

## Manual Setup

If you prefer to set up manually or the script doesn't work for your system:

### Step 1: Install cloudflared

**macOS:**
```bash
brew install cloudflared
```

**Linux:**
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Windows:**
Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

### Step 2: Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

### Step 3: Create a tunnel

```bash
cloudflared tunnel create flying-dog-inn-vtt
```

### Step 4: Get your tunnel token

```bash
cloudflared tunnel token flying-dog-inn-vtt
```

### Step 5: Create DNS record

Replace `vtt.yourdomain.com` with your desired subdomain:

```bash
cloudflared tunnel route dns flying-dog-inn-vtt vtt.yourdomain.com
```

### Step 6: Copy tunnel files to project

Copy the tunnel configuration and credentials to your project:

```bash
# Copy certificate
cp ~/.cloudflared/cert.pem ./cloudflared/

# Copy tunnel credentials (replace TUNNEL_ID with your actual tunnel ID)
cp ~/.cloudflared/TUNNEL_ID.json ./cloudflared/

# Create config file
cat > ./cloudflared/config.yml << EOF
tunnel: TUNNEL_ID
credentials-file: /etc/cloudflared/TUNNEL_ID.json

ingress:
  - hostname: vtt.yourdomain.com
    service: http://nginx:80
  - service: http_status:404
EOF
```

### Step 7: Create environment file

Create a `.env` file in the project root:

```bash
# Your tunnel URL (replace with your actual domain)
TUNNEL_URL=https://vtt.yourdomain.com
TUNNEL_WS_URL=wss://vtt.yourdomain.com

# Environment
NODE_ENV=production
```

## Architecture

The setup includes:

- **Nginx Reverse Proxy**: Routes requests to appropriate services
- **Frontend (React)**: Serves the web interface on port 3335
- **Backend API**: Handles game data and WebSocket connections on port 3334  
- **Auth Service**: Handles authentication on port 3333
- **Cloudflared**: Creates the secure tunnel to Cloudflare

### Routing

- `/` → Frontend (React app)
- `/api/` → Backend API
- `/api/auth/` → Auth service
- `/maps/` → Map images (served by backend)
- `/socket.io/` → WebSocket connections

## Starting the Application

1. Make sure your `.env` file and `./cloudflared/` directory are configured
2. Start the application:

```bash
./start.sh
# or manually:
docker-compose up -d
```

3. Your VTT will be available at your configured domain (e.g., `https://vtt.yourdomain.com`)

## Deploying to Another Machine

1. **Copy the entire project directory** (including `./cloudflared/` with credentials)
2. **Install Docker and Docker Compose** on the target machine
3. **Run the application**:
   ```bash
   docker-compose up -d
   ```

That's it! No additional setup required - the tunnel configuration travels with your project.

## Troubleshooting

### Tunnel not connecting
- Check that your tunnel configuration exists: `ls -la ./cloudflared/`
- Verify the tunnel credentials are present: `./cloudflared/TUNNEL_ID.json`
- Check tunnel logs: `docker-compose logs cloudflared`
- Verify tunnel exists: `cloudflared tunnel list` (if cloudflared installed on host)

### 502 Bad Gateway
- Ensure all services are running: `docker-compose ps`
- Check nginx logs: `docker-compose logs nginx`
- Verify internal networking between containers

### Authentication issues
- Check that `TUNNEL_URL` is set correctly in the environment
- Verify CORS settings are allowing your domain
- Check auth service logs: `docker-compose logs auth`

### WebSocket connection issues
- Ensure `TUNNEL_WS_URL` is set to `wss://yourdomain.com`
- Check that Cloudflare is not blocking WebSocket connections
- Verify Socket.IO routing in nginx.conf

## Security Notes

1. The tunnel provides automatic HTTPS encryption
2. Authentication is handled by the auth service with secure cookies
3. Rate limiting is implemented on login attempts
4. Database files are stored in persistent volumes

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `TUNNEL_URL` | Your public domain with HTTPS | `https://vtt.yourdomain.com` |
| `TUNNEL_WS_URL` | WebSocket URL with WSS | `wss://vtt.yourdomain.com` |
| `NODE_ENV` | Environment mode | `production` |

**Note**: Tunnel authentication is handled via configuration files in `./cloudflared/`, not environment variables.

## Support

If you encounter issues:

1. Check the Docker container logs: `docker-compose logs [service-name]`
2. Verify your Cloudflare tunnel status: `cloudflared tunnel list`
3. Test local connectivity: `docker-compose exec nginx curl http://frontend:3335`

For Cloudflare-specific issues, refer to the [Cloudflare Tunnel documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).

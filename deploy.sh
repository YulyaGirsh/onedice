#!/bin/bash

# OneDice Production Deployment Script
echo "🚀 OneDice - Production Deployment"
echo "=================================="

# Configuration
SERVER_USER="root"
SERVER_HOST="onedice.ru"
SERVER_PATH="/var/www/onedice"
NGINX_CONFIG="/etc/nginx/sites-available/onedice"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "📦 Building production version..."

# Build frontend
print_status "Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
    exit 1
fi

# Create deployment directory
print_status "Creating deployment structure..."
mkdir -p deploy/public
mkdir -p deploy/server

# Copy files
print_status "Copying files..."

# Copy frontend
cp -r dist/* deploy/public/

# Copy backend
cp -r server/* deploy/server/

# Copy configuration files
cp production.config.js deploy/
cp package.json deploy/
cp requirements.txt deploy/
cp .env deploy/
cp main-simple.py deploy/

# Copy icons
cp -r public/icons deploy/public/

print_status "Files copied successfully"

echo ""
echo "🚀 Deploying to server..."

# Upload to server
print_status "Uploading files to server..."
rsync -avz --delete deploy/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

if [ $? -ne 0 ]; then
    print_error "Upload failed"
    exit 1
fi

# Install dependencies on server
print_status "Installing dependencies on server..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
cd /var/www/onedice/server
npm install --production

cd /var/www/onedice
pip3 install -r requirements.txt
EOF

# Setup nginx
print_status "Configuring nginx..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
# Copy nginx config
cp /var/www/onedice/nginx.conf /etc/nginx/sites-available/onedice

# Enable site
ln -sf /etc/nginx/sites-available/onedice /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "Nginx configured successfully"
else
    echo "Nginx configuration error"
    exit 1
fi
EOF

# Setup systemd services
print_status "Setting up systemd services..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
# Copy service files
cp /var/www/onedice/onedice-backend.service /etc/systemd/system/
cp /var/www/onedice/onedice-bot.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable services
systemctl enable onedice-backend
systemctl enable onedice-bot

# Start services
systemctl restart onedice-backend
systemctl restart onedice-bot

# Check status
systemctl status onedice-backend --no-pager
systemctl status onedice-bot --no-pager
EOF

# Set permissions
print_status "Setting permissions..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
chown -R www-data:www-data /var/www/onedice
chmod -R 755 /var/www/onedice
chmod 600 /var/www/onedice/.env
EOF

print_status "Deployment completed successfully!"
echo ""
echo "🌐 Your app is now available at: https://onedice.ru"
echo "📊 Check status with: systemctl status onedice-backend onedice-bot"
echo "📝 View logs with: journalctl -u onedice-backend -f"

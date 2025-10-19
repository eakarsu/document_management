#!/bin/bash

# Nginx Setup Script for missionsyncai.com
# This script installs nginx, configures it, and sets up SSL with Let's Encrypt

set -e

echo "🚀 Setting up Nginx for missionsyncai.com"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update

# Install nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing nginx..."
    apt install -y nginx
else
    echo "✅ Nginx already installed"
fi

# Install certbot for Let's Encrypt SSL
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt install -y certbot python3-certbot-nginx
else
    echo "✅ Certbot already installed"
fi

# Create SSL directory
echo "📁 Creating SSL directory..."
mkdir -p /etc/nginx/ssl/missionsyncai.com

# Configure firewall to allow HTTP and HTTPS
echo "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    echo "📝 Enabling UFW firewall rules..."
    ufw allow 'Nginx Full' || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw allow 22/tcp || true  # Ensure SSH stays open
    echo "✅ Firewall rules configured"
else
    echo "⚠️  UFW not found, checking iptables..."
    # Ensure ports 80 and 443 are open
    iptables -I INPUT -p tcp --dport 80 -j ACCEPT || true
    iptables -I INPUT -p tcp --dport 443 -j ACCEPT || true
    echo "✅ Iptables rules configured"
fi

# Stop nginx temporarily
echo "⏸️  Stopping nginx..."
systemctl stop nginx || true

# Verify port 80 is not in use
echo "🔍 Checking if port 80 is available..."
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 80 is in use. Attempting to free it..."
    fuser -k 80/tcp || true
    sleep 2
fi

# Get SSL certificate from Let's Encrypt
echo "🔒 Obtaining SSL certificate from Let's Encrypt..."
echo "This will prompt you for email and agreement to terms of service"
# Use --preferred-challenges http to ensure HTTP-01 challenge on IPv4
# List www first so Let's Encrypt creates the directory as www.missionsyncai.com
certbot certonly --standalone --preferred-challenges http -d www.missionsyncai.com -d missionsyncai.com

# Verify certificate directory exists
if [ ! -d "/etc/letsencrypt/live/www.missionsyncai.com" ]; then
    echo "❌ Error: Certificate directory not found!"
    echo "Checking for alternative certificate directory..."
    if [ -d "/etc/letsencrypt/live/missionsyncai.com" ]; then
        echo "✅ Found certificates at /etc/letsencrypt/live/missionsyncai.com"
        CERT_DIR="missionsyncai.com"
    else
        echo "❌ No certificates found. Exiting."
        exit 1
    fi
else
    echo "✅ Certificates created at /etc/letsencrypt/live/www.missionsyncai.com"
    CERT_DIR="www.missionsyncai.com"
fi

# Copy SSL certificates to our directory (optional backup)
echo "📋 Copying SSL certificates..."
cp /etc/letsencrypt/live/${CERT_DIR}/fullchain.pem /etc/nginx/ssl/missionsyncai.com/
cp /etc/letsencrypt/live/${CERT_DIR}/privkey.pem /etc/nginx/ssl/missionsyncai.com/

echo "📝 Certificate directory: /etc/letsencrypt/live/${CERT_DIR}"

# Backup existing nginx config if it exists
if [ -f /etc/nginx/sites-available/missionsyncai.com ]; then
    echo "💾 Backing up existing config..."
    cp /etc/nginx/sites-available/missionsyncai.com /etc/nginx/sites-available/missionsyncai.com.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy nginx configuration
echo "📝 Installing nginx configuration..."
cp nginx.conf /etc/nginx/sites-available/missionsyncai.com

# Create symbolic link to enable site
echo "🔗 Enabling site..."
ln -sf /etc/nginx/sites-available/missionsyncai.com /etc/nginx/sites-enabled/

# Remove default nginx site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "🗑️  Removing default site..."
    rm -f /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

# Start nginx
echo "▶️  Starting nginx..."
systemctl start nginx
systemctl enable nginx

# Setup auto-renewal for SSL certificate
echo "⏰ Setting up automatic SSL renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# Display status
echo ""
echo "==========================================="
echo "✅ Nginx setup complete!"
echo "==========================================="
echo ""
echo "📊 Status:"
systemctl status nginx --no-pager -l
echo ""
echo "🌐 Your site should now be available at:"
echo "   https://missionsyncai.com"
echo "   https://www.missionsyncai.com"
echo ""
echo "📝 Configuration file: /etc/nginx/sites-available/missionsyncai.com"
echo "📋 SSL certificates: /etc/letsencrypt/live/${CERT_DIR}/"
echo "📋 SSL backup: /etc/nginx/ssl/missionsyncai.com/"
echo "📊 Logs: /var/log/nginx/missionsyncai.com.*.log"
echo ""
echo "🔄 SSL certificate will auto-renew daily at 3 AM"
echo ""
echo "⚠️  IMPORTANT: Make sure the following are configured:"
echo ""
echo "1. DNS Records:"
echo "   missionsyncai.com -> $(curl -s ifconfig.me)"
echo "   www.missionsyncai.com -> $(curl -s ifconfig.me)"
echo ""
echo "2. AWS Security Group (if using EC2):"
echo "   - Port 80 (HTTP) - Allow from 0.0.0.0/0"
echo "   - Port 443 (HTTPS) - Allow from 0.0.0.0/0"
echo "   - Port 22 (SSH) - Allow from your IP"
echo ""
echo "3. Firewall Status:"
ufw status | grep -E "80|443" || echo "   UFW not active or rules not set"
echo ""
echo "==========================================="

sudo certbot --nginx -d missionsyncai.com -d www.missionsyncai.com --staging

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

# Stop nginx temporarily
echo "⏸️  Stopping nginx..."
systemctl stop nginx || true

# Get SSL certificate from Let's Encrypt
echo "🔒 Obtaining SSL certificate from Let's Encrypt..."
echo "This will prompt you for email and agreement to terms of service"
# Use --preferred-challenges http to ensure HTTP-01 challenge on IPv4
certbot certonly --standalone --preferred-challenges http -d missionsyncai.com -d www.missionsyncai.com

# Copy SSL certificates to our directory
echo "📋 Copying SSL certificates..."
cp /etc/letsencrypt/live/missionsyncai.com/fullchain.pem /etc/nginx/ssl/missionsyncai.com/
cp /etc/letsencrypt/live/missionsyncai.com/privkey.pem /etc/nginx/ssl/missionsyncai.com/

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
echo "📋 SSL certificates: /etc/nginx/ssl/missionsyncai.com/"
echo "📊 Logs: /var/log/nginx/missionsyncai.com.*.log"
echo ""
echo "🔄 SSL certificate will auto-renew daily at 3 AM"
echo ""
echo "⚠️  Make sure your DNS is pointing to this server:"
echo "   missionsyncai.com -> $(curl -s ifconfig.me)"
echo "   www.missionsyncai.com -> $(curl -s ifconfig.me)"
echo "==========================================="

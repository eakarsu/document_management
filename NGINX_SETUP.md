# Nginx Setup for missionsyncai.com

This guide will help you set up Nginx as a reverse proxy to make your Richmond DMS accessible via `https://missionsyncai.com`.

## Prerequisites

1. **DNS Configuration**: Point your domain to your AWS EC2 instance
   ```
   A Record: missionsyncai.com -> 35.92.161.166
   A Record: www.missionsyncai.com -> 35.92.161.166
   ```

2. **Firewall/Security Group**: Ensure ports 80 and 443 are open
   ```bash
   # On AWS EC2, update Security Group to allow:
   - Port 80 (HTTP) - 0.0.0.0/0
   - Port 443 (HTTPS) - 0.0.0.0/0
   ```

## Installation Steps

### Step 1: Upload Files to AWS EC2

Copy the nginx configuration files to your EC2 instance:

```bash
# From your local machine
scp nginx.conf setup-nginx.sh ubuntu@35.92.161.166:~/
```

Or if you prefer, copy the content manually.

### Step 2: Run Setup Script on AWS EC2

SSH into your EC2 instance and run:

```bash
ssh ubuntu@35.92.161.166

# Make script executable (if not already)
chmod +x setup-nginx.sh

# Run the setup script
sudo ./setup-nginx.sh
```

The script will:
- Install nginx
- Install certbot for SSL certificates
- Obtain SSL certificate from Let's Encrypt
- Configure nginx to proxy to your app
- Set up auto-renewal for SSL certificates

### Step 3: Verify Installation

Check if nginx is running:
```bash
sudo systemctl status nginx
```

Test the configuration:
```bash
sudo nginx -t
```

View logs:
```bash
sudo tail -f /var/log/nginx/missionsyncai.com.access.log
sudo tail -f /var/log/nginx/missionsyncai.com.error.log
```

### Step 4: Access Your Site

Open your browser and navigate to:
- https://missionsyncai.com
- https://www.missionsyncai.com

## Manual Setup (Alternative)

If you prefer manual setup:

### 1. Install Nginx and Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Get SSL Certificate

```bash
sudo certbot certonly --standalone -d missionsyncai.com -d www.missionsyncai.com
```

### 3. Copy Nginx Config

```bash
sudo cp nginx.conf /etc/nginx/sites-available/missionsyncai.com
sudo ln -s /etc/nginx/sites-available/missionsyncai.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 4. Update SSL Paths in Config

Edit `/etc/nginx/sites-available/missionsyncai.com` and update SSL certificate paths:

```nginx
ssl_certificate /etc/letsencrypt/live/missionsyncai.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/missionsyncai.com/privkey.pem;
```

### 5. Test and Restart

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 6. Setup Auto-Renewal

```bash
sudo crontab -e
# Add this line:
0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'
```

## Troubleshooting

### SSL Certificate Issues

If certbot fails, make sure:
1. DNS is properly configured and propagated
2. Ports 80 and 443 are open
3. No other service is using port 80/443

Check DNS:
```bash
nslookup missionsyncai.com
dig missionsyncai.com
```

### Nginx Errors

Check error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

Test configuration:
```bash
sudo nginx -t
```

### Connection Refused

Make sure your Docker containers are running:
```bash
docker ps
```

Restart if needed:
```bash
docker-compose -f docker-compose.aws.yml --env-file .env.aws restart
```

### Check if Backend is Accessible

```bash
curl http://localhost:3000
curl http://localhost:4000/health
```

## Configuration Details

### Nginx Configuration Overview

- **Frontend**: Proxies `https://missionsyncai.com/` to `http://35.92.161.166:3000`
- **Backend API**: Proxies `https://missionsyncai.com/api/` to `http://35.92.161.166:4000`
- **SSL**: Automatic HTTPS with Let's Encrypt
- **HTTP to HTTPS**: Automatic redirect
- **WebSocket**: Supported for real-time features

### File Locations

- Config: `/etc/nginx/sites-available/missionsyncai.com`
- SSL Certs: `/etc/letsencrypt/live/missionsyncai.com/`
- Access Log: `/var/log/nginx/missionsyncai.com.access.log`
- Error Log: `/var/log/nginx/missionsyncai.com.error.log`

## Useful Commands

```bash
# Restart nginx
sudo systemctl restart nginx

# Reload nginx (without dropping connections)
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View access logs
sudo tail -f /var/log/nginx/missionsyncai.com.access.log

# View error logs
sudo tail -f /var/log/nginx/missionsyncai.com.error.log

# Manually renew SSL certificate
sudo certbot renew --dry-run
sudo certbot renew

# Check SSL certificate expiry
sudo certbot certificates
```

## Security Notes

- SSL/TLS is configured with strong ciphers (TLSv1.2+)
- HSTS is enabled for enhanced security
- Security headers are added (X-Frame-Options, X-XSS-Protection, etc.)
- SSL certificates auto-renew every 90 days

## Next Steps

After nginx is set up:

1. Update your application's environment variables if needed
2. Test all functionality at https://missionsyncai.com
3. Monitor nginx logs for any issues
4. Set up monitoring/alerts for SSL certificate expiry (though auto-renewal should handle it)

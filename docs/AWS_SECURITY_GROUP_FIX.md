# Fix SSL Certificate Issue - AWS Security Group Configuration

## Problem

Let's Encrypt cannot validate your domain because ports 80 and 443 are not accessible from the internet.

Error from setup:
```
Domain: www.missionsyncai.com
Type: connection
Detail: Timeout during connect (likely firewall problem)
```

## Solution: Open Ports 80 and 443 in AWS Security Group

### Step 1: Access AWS Console

1. Go to https://console.aws.amazon.com
2. Login with your AWS credentials
3. Make sure you're in the **US West (Oregon)** region (top right)

### Step 2: Find Your EC2 Instance

1. Click **Services** (top left)
2. Under **Compute**, click **EC2**
3. In the left sidebar, click **Instances**
4. Find your instance with IP **35.92.161.166**
5. Click on the **Instance ID**

### Step 3: Update Security Group

1. In the instance details page, scroll down to **Security** tab
2. Under **Security groups**, you'll see something like `sg-xxxxxxxxx (launch-wizard-1)` or similar
3. Click on the security group name (the blue link)

### Step 4: Add Inbound Rules

1. Click the **Inbound rules** tab
2. Click **Edit inbound rules** button (top right)
3. Click **Add rule** button

**Add HTTP Rule:**
- **Type**: Select **HTTP** from dropdown
- **Protocol**: TCP (auto-filled)
- **Port range**: 80 (auto-filled)
- **Source**: Select **Anywhere-IPv4** (0.0.0.0/0)
- **Description**: "Allow HTTP for Let's Encrypt validation"

4. Click **Add rule** again

**Add HTTPS Rule:**
- **Type**: Select **HTTPS** from dropdown
- **Protocol**: TCP (auto-filled)
- **Port range**: 443 (auto-filled)
- **Source**: Select **Anywhere-IPv4** (0.0.0.0/0)
- **Description**: "Allow HTTPS for web traffic"

5. Click **Save rules** button (bottom right)

### Your Security Group Should Look Like This:

```
Inbound rules:
┌──────────┬──────────┬──────────────┬────────────────┬─────────────┐
│ Type     │ Protocol │ Port range   │ Source         │ Description │
├──────────┼──────────┼──────────────┼────────────────┼─────────────┤
│ SSH      │ TCP      │ 22           │ 0.0.0.0/0      │ SSH access  │
│ Custom   │ TCP      │ 3000         │ 0.0.0.0/0      │ Frontend    │
│ Custom   │ TCP      │ 4000         │ 0.0.0.0/0      │ Backend     │
│ HTTP     │ TCP      │ 80           │ 0.0.0.0/0      │ Let's...    │
│ HTTPS    │ TCP      │ 443          │ 0.0.0.0/0      │ Web traffic │
└──────────┴──────────┴──────────────┴────────────────┴─────────────┘
```

### Step 5: Verify Ports Are Open

From your **local computer** (Mac), test if ports are accessible:

```bash
# Test port 80
nc -zv 35.92.161.166 80

# Test port 443
nc -zv 35.92.161.166 443
```

You should see: `Connection to 35.92.161.166 port 80 [tcp/http] succeeded!`

### Step 6: Retry SSL Certificate Setup

SSH back into your AWS instance and run the setup script again:

```bash
ssh ubuntu@35.92.161.166

# Run the nginx setup script again
sudo ./setup-nginx.sh
```

This time, Let's Encrypt should be able to validate your domain and issue the SSL certificate.

## After SSL Certificate Is Obtained

Once the script completes successfully:

1. Access your site at:
   - https://missionsyncai.com
   - https://www.missionsyncai.com

2. Verify SSL certificate:
   ```bash
   # From your AWS instance
   sudo certbot certificates
   ```

3. Check nginx is running:
   ```bash
   sudo systemctl status nginx
   ```

## Troubleshooting

### If you still get SSL errors after opening ports:

1. **Check if nginx is blocking the port:**
   ```bash
   ssh ubuntu@35.92.161.166
   sudo systemctl stop nginx
   sudo ./setup-nginx.sh
   ```

2. **Check if Docker is using port 80:**
   ```bash
   sudo docker ps
   # Look for any container using port 80
   ```

3. **Verify ports are actually open from outside:**
   - Use online tool: https://www.yougetsignal.com/tools/open-ports/
   - Enter IP: 35.92.161.166
   - Test ports: 80 and 443

### If certbot still fails:

Try manual certificate request:
```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d missionsyncai.com -d www.missionsyncai.com --dry-run
```

If dry-run succeeds, remove `--dry-run` and run again for real certificate.

## Security Note

Opening ports 80 and 443 to 0.0.0.0/0 (anywhere) is **safe and required** for:
- Port 80: HTTP traffic and Let's Encrypt validation
- Port 443: HTTPS encrypted traffic

These are standard web server ports that must be publicly accessible.

After SSL is set up, you can optionally:
- Close port 3000 (frontend) since nginx will proxy it
- Close port 4000 (backend) since nginx will proxy it

But this is optional - nginx will handle the routing securely.

## Quick Reference

```
AWS Console Path:
EC2 → Instances → [Your Instance] → Security Tab → Security Groups → Edit Inbound Rules

Required Rules:
├── HTTP  (80)  ← 0.0.0.0/0
└── HTTPS (443) ← 0.0.0.0/0

Then: sudo ./setup-nginx.sh
```

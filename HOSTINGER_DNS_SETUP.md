# Hostinger DNS Setup for missionsyncai.com

## Step-by-Step Guide to Point Your Domain to AWS

### Step 1: Login to Hostinger

1. Go to https://www.hostinger.com
2. Click "Login" (top right)
3. Enter your credentials

### Step 2: Access DNS Settings

1. Once logged in, go to your **Dashboard**
2. Find **"Domains"** section in the left sidebar or main menu
3. Click on your domain **missionsyncai.com**
4. Click on **"DNS / Name Servers"** or **"Manage DNS"**

### Step 3: Configure DNS Records

You need to add/update these DNS records:

#### A Records (Point domain to AWS IP)

| Type | Name/Host | Points to (Value) | TTL |
|------|-----------|-------------------|-----|
| A    | @         | 35.92.161.166     | 3600 or Auto |
| A    | www       | 35.92.161.166     | 3600 or Auto |

**Detailed Steps:**

1. **Delete existing A records** (if any exist for @ and www)
   - Look for existing A records with @ or www
   - Click the trash/delete icon next to them

2. **Add new A record for root domain (@)**
   - Click **"Add Record"** or **"Add New Record"**
   - Type: Select **"A"**
   - Name/Host: Enter **"@"** (this represents your root domain)
   - Points to/Value: Enter **"35.92.161.166"**
   - TTL: Leave as default (3600) or select "Auto"
   - Click **"Add"** or **"Save"**

3. **Add new A record for www subdomain**
   - Click **"Add Record"** again
   - Type: Select **"A"**
   - Name/Host: Enter **"www"**
   - Points to/Value: Enter **"35.92.161.166"**
   - TTL: Leave as default (3600) or select "Auto"
   - Click **"Add"** or **"Save"**

### Step 4: Remove Conflicting Records (Important!)

Make sure to **delete or disable** these if they exist:
- Any CNAME records for @ or www
- Any other A records pointing to different IPs
- Parking page redirects

### Step 5: Verify Name Servers

Make sure your domain is using Hostinger's name servers (should be default):

```
ns1.dns-parking.com
ns2.dns-parking.com
```

OR

```
ns1.hostinger.com
ns2.hostinger.com
```

If you see different name servers, you may need to change them back to Hostinger's default.

### Step 6: Save Changes

1. Click **"Save"** or **"Save Changes"** at the bottom of the DNS page
2. You should see a confirmation message

## DNS Propagation

- **Propagation Time**: 1-48 hours (usually 1-4 hours)
- **Check Propagation**: Use these tools to verify:
  - https://dnschecker.org (enter missionsyncai.com)
  - https://www.whatsmydns.net

## Verification Steps

### After DNS Propagation (1-4 hours)

**From your local computer:**

```bash
# Check if DNS is pointing to your AWS server
nslookup missionsyncai.com
# Should show: 35.92.161.166

dig missionsyncai.com
# Should show: 35.92.161.166

ping missionsyncai.com
# Should show: 35.92.161.166
```

**Or use online tool:**
- Go to https://dnschecker.org
- Enter: `missionsyncai.com`
- Should show IP: `35.92.161.166` globally

## Hostinger Control Panel Screenshots Guide

### Finding DNS Settings in Hostinger:

**Option 1: hPanel (Modern Interface)**
```
Dashboard → Domains → missionsyncai.com → DNS / Name Servers → Manage DNS Records
```

**Option 2: Classic Panel**
```
Domains → missionsyncai.com → DNS Zone → Manage
```

**Option 3: Direct Access**
```
Dashboard → DNS Zone Editor → Select missionsyncai.com
```

## Example: How Your DNS Should Look

After configuration, your DNS records should look like this:

```
Type    Name    Value               TTL
----    ----    -----               ---
A       @       35.92.161.166       3600
A       www     35.92.161.166       3600
```

## Common Hostinger-Specific Tips

### If You Have Hostinger Email

If you're using Hostinger email, you'll also see these records (keep them):
```
MX      @       mx1.hostinger.com    Priority: 10
MX      @       mx2.hostinger.com    Priority: 20
TXT     @       v=spf1 ...           (SPF record)
```

**Don't delete these!** They're for your email to work.

### If Cloudflare is Enabled

If you see Cloudflare name servers, you need to:
1. Disable Cloudflare integration in Hostinger
2. OR configure DNS in Cloudflare instead of Hostinger

To check:
- Look at your name servers in Hostinger
- If they show `ns1.cloudflare.com`, configure in Cloudflare
- If they show `ns1.hostinger.com`, configure in Hostinger

### Website Parking/Redirect

If you have a parking page or redirect:
1. Go to **"Websites"** in Hostinger
2. Find missionsyncai.com
3. Click **"Manage"**
4. **Disable** any parking page or redirect
5. **Don't** connect it to Hostinger hosting (we're using AWS)

## After DNS is Configured

Once DNS propagation is complete (wait 1-4 hours):

### 1. SSH to your AWS server
```bash
ssh ubuntu@35.92.161.166
```

### 2. Run the nginx setup script
```bash
sudo ./setup-nginx.sh
```

The script will:
- Install nginx
- Get SSL certificate from Let's Encrypt
- Configure reverse proxy
- Enable HTTPS

### 3. Access your site
```
https://missionsyncai.com
https://www.missionsyncai.com
```

## Troubleshooting

### DNS Not Updating?

1. **Clear your browser cache**
2. **Flush DNS cache on your computer:**
   - Windows: `ipconfig /flushdns`
   - Mac: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
   - Linux: `sudo systemd-resolve --flush-caches`

### Still Seeing Hostinger Parking Page?

- Wait longer (up to 48 hours)
- Disable website parking in Hostinger
- Make sure A records are correct
- Check using incognito/private browser

### SSL Certificate Error "Domain not pointing to server"?

- DNS not propagated yet (wait longer)
- A records not configured correctly
- Check with: `nslookup missionsyncai.com`

## Support

If you have issues:

1. **Hostinger Support**:
   - Chat: Available in your hPanel
   - Ticket: Open from dashboard

2. **DNS Check Tools**:
   - https://dnschecker.org
   - https://www.whatsmydns.net
   - https://mxtoolbox.com/DNSLookup.aspx

3. **AWS Security Group**:
   - Make sure ports 80 and 443 are open
   - AWS Console → EC2 → Security Groups

## Quick Reference Card

```
Domain:          missionsyncai.com
AWS IP:          35.92.161.166
Nameservers:     ns1.hostinger.com / ns2.hostinger.com

DNS Records to Add:
├── A    @      →  35.92.161.166
└── A    www    →  35.92.161.166

Wait: 1-48 hours for DNS propagation
Then: Run nginx setup script on AWS
Access: https://missionsyncai.com
```

---

**Next Step**: After DNS propagates, follow [NGINX_SETUP.md](./NGINX_SETUP.md) to complete the setup.

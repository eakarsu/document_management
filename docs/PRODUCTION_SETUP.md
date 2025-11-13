# Production Setup Guide

## Overview

This guide will help you deploy Richmond DMS to production with secure credentials and proper configuration.

## Key Differences: Development vs Production

### Development Mode
- Shows all test users with passwords on login page
- Uses simple passwords like `testpass123`
- `NEXT_PUBLIC_APP_MODE=development`

### Production Mode
- **Clean login screen** - NO user list displayed
- Secure randomly generated passwords
- `NEXT_PUBLIC_APP_MODE=production`

---

## Step 1: Configure Environment Variables

### 1.1 Create Production Environment File

```bash
# Copy the template
cp .env.production.template .env.production
```

### 1.2 Edit `.env.production`

**CRITICAL SETTINGS:**

```bash
# Set to 'production' to hide test users on login page
NEXT_PUBLIC_APP_MODE=production

# Your production URLs
NEXT_PUBLIC_API_URL=https://your-domain.com:4000
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com:4000
```

**SECURITY - MUST CHANGE:**

```bash
# Database password
POSTGRES_PASSWORD=YourSecurePasswordHere

# JWT Secrets - Generate with: openssl rand -base64 32
JWT_SECRET=<paste-random-string-here>
JWT_REFRESH_SECRET=<paste-different-random-string-here>
```

To generate secure JWT secrets:
```bash
openssl rand -base64 32
openssl rand -base64 32
```

---

## Step 2: Generate Production Users

### 2.1 Run Production Seed Script

This will create all users with **secure random passwords**:

```bash
cd backend
npx ts-node prisma/seed-production.ts
```

### 2.2 Retrieve Credentials

After seeding, you'll find credentials in:
```
PRODUCTION_CREDENTIALS.txt
```

**Example output:**
```
==========================================
RICHMOND DMS - PRODUCTION CREDENTIALS
==========================================

SYSTEM ADMINISTRATOR
-------------------------------------------
Email: admin@richmond-dms.com
Password: A7k$mP9@xQ2#nR5L
Role: Admin

WORKFLOW USERS (10 STAGES)
-------------------------------------------

Stage 1: Initial Draft
-------------------------------------------
Name: Primary Action Officer
Email: ao1@airforce.mil
Password: X2$pK8#mN4@qT6!v
Role: ACTION_OFFICER

... (continues for all 13 users)
```

### 2.3 Secure the Credentials

⚠️ **IMPORTANT:**
1. **DO NOT** commit `PRODUCTION_CREDENTIALS.txt` to Git
2. Store credentials in a secure password manager (1Password, LastPass, etc.)
3. Share credentials via secure channel only (not email!)
4. Delete the file after distributing credentials
5. Instruct users to change passwords after first login

---

## Step 3: Deploy to Production

### 3.1 Using Docker Compose

```bash
# Build and start with production environment
docker-compose -f docker-compose.aws.yml --env-file .env.production up -d
```

### 3.2 Verify Deployment

1. **Check Login Page:**
   - Navigate to `https://your-domain.com/login`
   - Should see **ONLY** email/password fields
   - **NO** quick login buttons
   - **NO** test user information

2. **Test Login:**
   - Use credentials from `PRODUCTION_CREDENTIALS.txt`
   - Example: `admin@richmond-dms.com` with generated password

---

## Step 4: Share Credentials with Customer

### 4.1 Create Customer Documentation

Create a document for your customer:

```
RICHMOND DMS - LOGIN CREDENTIALS

Login URL: https://your-domain.com/login

==========================================
ADMINISTRATOR ACCOUNT
==========================================
Email: admin@richmond-dms.com
Password: [paste secure password]

Please change this password immediately after first login.

==========================================
WORKFLOW USERS
==========================================

Action Officer 1:
  Email: ao1@airforce.mil
  Password: [paste secure password]

Action Officer 2:
  Email: ao2@airforce.mil
  Password: [paste secure password]

... (include all users)

==========================================
FIRST LOGIN INSTRUCTIONS
==========================================
1. Navigate to: https://your-domain.com/login
2. Enter your email and password
3. After login, change your password immediately
4. Use the Profile page to update your information

==========================================
SECURITY NOTES
==========================================
- Keep your password secure
- Do not share credentials
- Log out when done
- Report any security concerns immediately
```

### 4.2 Secure Distribution Methods

Choose ONE secure method:

1. **Encrypted Email:**
   - Use PGP/GPG encryption
   - Password-protected ZIP file (send password separately)

2. **Secure File Sharing:**
   - Use encrypted services (Tresorit, SpiderOak)
   - Set expiration dates

3. **Password Manager Sharing:**
   - 1Password team vaults
   - LastPass shared folders

4. **In-Person:**
   - USB drive delivered securely
   - Printed document handed directly

---

## Step 5: User Roles and Access

### All Production Users (13 total):

| Email | Role | Stage | Access Level |
|-------|------|-------|-------------|
| admin@richmond-dms.com | Admin | - | Full system access |
| ao1@airforce.mil | ACTION_OFFICER | Stage 1 | Create/edit documents |
| ao2@airforce.mil | ACTION_OFFICER | Stage 1 | Create/edit documents |
| pcm@airforce.mil | PCM | Stage 2 | Review documents |
| opr1@airforce.mil | OPR | Stage 3 | Review/approve |
| opr2@airforce.mil | OPR | Stage 3 | Review/approve |
| ocr@airforce.mil | OCR | Stage 4 | Review |
| legal@airforce.mil | STAFF_JUDGE_ADVOCATE | Stage 5 | Legal review |
| sqdn.cc@airforce.mil | SQUADRON_COMMANDER | Stage 6 | Approve |
| group.cc@airforce.mil | GROUP_COMMANDER | Stage 7 | Approve |
| wing.cc@airforce.mil | WING_COMMANDER | Stage 8 | Approve |
| majcom@airforce.mil | MAJCOM_REVIEWER | Stage 9 | Review |
| hqaf@airforce.mil | HQAF_APPROVER | Stage 10 | Final approval |

---

## Step 6: Verify Production Security

### 6.1 Checklist

- [ ] `NEXT_PUBLIC_APP_MODE=production` is set
- [ ] Login page shows NO test users
- [ ] All passwords are secure (16+ characters)
- [ ] JWT secrets are random and different from each other
- [ ] Database password is secure
- [ ] HTTPS is enabled
- [ ] Firewall rules are configured
- [ ] `PRODUCTION_CREDENTIALS.txt` is deleted or secured

### 6.2 Test Login Page

Visit: `https://your-domain.com/login`

**Should See:**
- Clean login form
- Email field
- Password field
- "Sign In" button
- Company name and logo

**Should NOT See:**
- List of test users
- Quick login buttons
- Passwords displayed
- Development warnings

---

## Step 7: Post-Deployment

### 7.1 Monitor Logs

```bash
# View application logs
docker-compose -f docker-compose.aws.yml logs -f app

# View specific service
docker logs richmond-dms-app
```

### 7.2 Backup Strategy

1. **Database Backups:**
```bash
# Manual backup
docker exec richmond-dms-postgres pg_dump -U postgres dms_production > backup_$(date +%Y%m%d).sql
```

2. **Automated Backups:**
   - Set up daily cron job
   - Store backups offsite (S3, etc.)

### 7.3 User Password Changes

Instruct all users to change passwords after first login:
1. Log in with provided credentials
2. Go to Profile page
3. Change password
4. Log out and log back in

---

## Troubleshooting

### Issue: Test users still showing on login page

**Solution:**
```bash
# Check environment variable
docker exec richmond-dms-app printenv NEXT_PUBLIC_APP_MODE
# Should output: production

# If not, rebuild:
docker-compose -f docker-compose.aws.yml down
docker-compose -f docker-compose.aws.yml build --no-cache
docker-compose -f docker-compose.aws.yml up -d
```

### Issue: Cannot log in with generated passwords

**Solution:**
1. Check that seed script ran successfully
2. Verify database contains users:
```bash
docker exec richmond-dms-postgres psql -U postgres -d dms_production -c "SELECT email, name FROM users;"
```

3. Re-run seed if needed:
```bash
docker exec richmond-dms-app npx ts-node /app/backend/prisma/seed-production.ts
```

### Issue: Forgot to save credentials

**Solution:**
Re-run seed script (it will output credentials again):
```bash
docker exec richmond-dms-app npx ts-node /app/backend/prisma/seed-production.ts
```

---

## Security Best Practices

1. **Change All Default Values:**
   - Database passwords
   - JWT secrets
   - Admin passwords

2. **Enable HTTPS:**
   - Use Let's Encrypt certificates
   - Redirect HTTP to HTTPS

3. **Firewall Configuration:**
   - Only expose ports 80 (HTTP) and 443 (HTTPS)
   - Block direct database access

4. **Regular Updates:**
   - Update Docker images
   - Apply security patches
   - Monitor for vulnerabilities

5. **User Access:**
   - Audit user accounts regularly
   - Disable inactive users
   - Enforce strong passwords

6. **Monitoring:**
   - Set up logging
   - Monitor failed login attempts
   - Alert on suspicious activity

---

## Support

For issues or questions:
1. Check application logs
2. Review this documentation
3. Contact support team

---

## Quick Reference

### Restart Application
```bash
docker-compose -f docker-compose.aws.yml restart app
```

### View Logs
```bash
docker-compose -f docker-compose.aws.yml logs -f
```

### Backup Database
```bash
docker exec richmond-dms-postgres pg_dump -U postgres dms_production > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker exec -i richmond-dms-postgres psql -U postgres -d dms_production
```

---

**Generated:** $(date)
**Version:** 1.0

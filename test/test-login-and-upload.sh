#!/bin/bash

# Quick Login and Upload Testing Guide
# Test the binary diff system with proper authentication

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🔐 Login Required - Binary Diff Testing Guide${NC}"
echo "=============================================="

# Check if system is running
if ! curl -s http://localhost:4000/health >/dev/null 2>&1; then
    echo -e "${RED}❌ System not running. Please start with: ./start.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ System is running!${NC}"
echo

echo -e "${BLUE}🔐 Step 1: Login First${NC}"
echo "===================="
echo -e "${GREEN}🔗 Login Page:${NC} http://localhost:3000/login"
echo
echo -e "${YELLOW}Demo Credentials:${NC}"
echo -e "${GREEN}👑 Admin:${NC}    admin@richmond-dms.com / admin123"
echo "   • Full permissions (create, edit, approve, publish)"
echo "   • Can see all binary diff analytics"
echo
echo -e "${GREEN}👔 Manager:${NC}  manager@richmond-dms.com / manager123"
echo "   • Can create, edit, and approve documents" 
echo "   • Perfect for collaborative testing"
echo
echo -e "${GREEN}👤 User:${NC}     user@richmond-dms.com / user123"
echo "   • Can create and edit documents"
echo "   • Cannot approve or publish"
echo

echo -e "${BLUE}🧪 Step 2: Test Binary Diff (After Login)${NC}"
echo "======================================="
echo -e "${GREEN}🔗 Resume Document:${NC} http://localhost:3000/documents/cmea9dvgk0021vx8chm8sogur"
echo
echo -e "${YELLOW}Testing Steps:${NC}"
echo "1. Login with any account above"
echo "2. Go to Resume document (link above)"  
echo "3. Document Actions → Edit → Upload New Version"
echo "4. Choose a modified file"
echo "5. See dialog close automatically ✅"
echo "6. Check Version History for binary diff analytics!"

echo

echo -e "${BLUE}💡 What You'll See After Upload:${NC}"
echo "================================"
echo -e "${GREEN}✅ Success Message:${NC} 'New version uploaded successfully!'"
echo -e "${GREEN}✅ Dialog Closes:${NC} Upload dialog closes automatically"
echo -e "${GREEN}✅ Version History:${NC} Shows new version with analytics"
echo
echo "Version History Example:"
echo -e "   ${GREEN}📊 MINOR changes${NC} | ${BLUE}🔢 3.1% changed${NC} | ${YELLOW}📈 96.9% similarity${NC} | ${PURPLE}💾 89% compression${NC}"
echo -e "   ${GREEN}[Download] [Compare] [Approve]${NC}"

echo

echo -e "${BLUE}🔄 Collaborative Testing (Multi-User)${NC}"
echo "===================================="
echo "1. Open 3 browser tabs/windows"
echo "2. Login as different users in each:"
echo "   • Tab 1: admin@richmond-dms.com"
echo "   • Tab 2: manager@richmond-dms.com" 
echo "   • Tab 3: user@richmond-dms.com"
echo "3. All go to Resume document"
echo "4. Each user: Download → Edit → Upload"
echo "5. Watch binary diff analytics track changes from each user!"

echo

echo -e "${BLUE}🚨 Authentication Notes:${NC}"
echo "======================"
echo -e "${GREEN}✅ Tokens:${NC} Stored in localStorage after login"
echo -e "${GREEN}✅ Session:${NC} Persists across browser refreshes"
echo -e "${GREEN}✅ Security:${NC} All API calls include Bearer token"
echo -e "${GREEN}✅ Permissions:${NC} Different users have different capabilities"

echo

echo -e "${YELLOW}🎪 Quick Test Sequence (5 minutes):${NC}"
echo "=================================="
echo -e "${GREEN}1.${NC} Click: http://localhost:3000/login"
echo -e "${GREEN}2.${NC} Login as: admin@richmond-dms.com / admin123"
echo -e "${GREEN}3.${NC} Click: http://localhost:3000/documents/cmea9dvgk0021vx8chm8sogur"
echo -e "${GREEN}4.${NC} Download Resume.docx → Edit it → Upload new version"
echo -e "${GREEN}5.${NC} Watch dialog close ✅ and see binary diff analytics!"

echo

echo -e "${GREEN}🎉 After login, your hybrid binary diff system will work perfectly"
echo -e "   with automatic dialog closing and real-time change analytics! 🚀${NC}"

# Offer to open browser
if command -v open >/dev/null 2>&1; then
    echo
    read -p "Open login page now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "http://localhost:3000/login"
        echo -e "${GREEN}🌐 Login page opened!${NC}"
        echo -e "${BLUE}   Login and then test document upload!${NC}"
    fi
fi
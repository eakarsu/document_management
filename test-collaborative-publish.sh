#!/bin/bash

# Test Collaborative Document Publishing Workflow
# Tests multi-user collaboration with binary diff tracking

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🚀 Testing Collaborative Document Publishing Workflow${NC}"
echo "================================================================"

# Check if system is running
if ! curl -s http://localhost:4000/health >/dev/null 2>&1; then
    echo -e "${RED}❌ System not running. Please start with: ./start.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ System is running!${NC}"
echo

echo -e "${BLUE}👥 Available Demo Users for Testing:${NC}"
echo "===================================="
echo -e "${GREEN}👑 Admin:${NC}    admin@richmond-dms.com / admin123"
echo "   • Can create, edit, approve, and publish documents"
echo "   • Can see all binary diff analytics"
echo "   • Has full workflow permissions"
echo
echo -e "${GREEN}👔 Manager:${NC}  manager@richmond-dms.com / manager123"
echo "   • Can create and edit documents"  
echo "   • Can approve documents from contributors"
echo "   • Can view diff analytics for approval decisions"
echo
echo -e "${GREEN}👤 User:${NC}     user@richmond-dms.com / user123"
echo "   • Can create and edit documents"
echo "   • Cannot approve or publish"
echo "   • Can see diff analytics on their own documents"
echo

echo -e "${BLUE}🔄 Document Workflow States:${NC}"
echo "============================"
echo "DRAFT → IN_REVIEW → APPROVED → PUBLISHED"
echo "Each state change is tracked with binary diff analytics"
echo

echo -e "${BLUE}📋 Ready Test Document:${NC}"
echo "======================="
echo -e "${GREEN}🔗 Resume.docx:${NC} http://localhost:3000/documents/cmea9dvgk0021vx8chm8sogur"
echo "   • Already uploaded and ready for collaborative editing"
echo "   • Perfect for testing multi-user workflow"
echo "   • Binary diff will track changes from each contributor"
echo

echo -e "${BLUE}🎯 Collaborative Testing Scenario:${NC}"
echo "=================================="

echo -e "${GREEN}Step 1: User Creates/Edits Document${NC}"
echo "   • Login as: user@richmond-dms.com / user123"
echo "   • Go to Resume document (link above)"
echo "   • Download → Edit → Upload new version"
echo "   • Status: DRAFT → IN_REVIEW"

echo -e "${GREEN}Step 2: Manager Reviews & Makes Changes${NC}"  
echo "   • Login as: manager@richmond-dms.com / manager123"
echo "   • Edit the same document"
echo "   • Upload another version"
echo "   • Binary diff shows: Manager's changes vs User's version"

echo -e "${GREEN}Step 3: Admin Approves & Publishes${NC}"
echo "   • Login as: admin@richmond-dms.com / admin123"
echo "   • In Version History → Click [Approve] on latest version"
echo "   • Document Actions → Publish Document"
echo "   • Status: PUBLISHED (contains all contributors' changes)"

echo -e "${GREEN}Step 4: Review Binary Diff Analytics${NC}"
echo "   • Check Version History section"
echo "   • Each version shows contributor and change analytics"
echo "   • Click [Compare] buttons to see detailed diff statistics"

echo

echo -e "${BLUE}💡 What You'll See:${NC}"
echo "=================="
echo "Version History with Multi-User Changes:"
echo -e "   ${GREEN}Version 3 (PUBLISHED)${NC} - by admin@richmond-dms.com"
echo -e "   ${GREEN}📊 MINOR changes${NC} | ${BLUE}🔢 2.1% changed${NC} | ${YELLOW}📈 97.9% similarity${NC}"
echo
echo -e "   ${YELLOW}Version 2 (APPROVED)${NC} - by manager@richmond-dms.com"  
echo -e "   ${YELLOW}📊 MAJOR changes${NC} | ${BLUE}🔢 15.3% changed${NC} | ${YELLOW}📈 84.7% similarity${NC}"
echo
echo -e "   ${BLUE}Version 1 (ORIGINAL)${NC} - by user@richmond-dms.com"
echo -e "   ${BLUE}📄 Original document${NC}"

echo

echo -e "${BLUE}🔍 Compare Button Details:${NC}"
echo "=========================="
echo "Click any [Compare] button to see:"
echo "   • Contributors: user@richmond-dms.com → manager@richmond-dms.com"
echo "   • Change Category: MAJOR"
echo "   • Bytes Changed: 8.7KB"
echo "   • Percent Changed: 15.3%"
echo "   • Similarity: 84.7%"
echo "   • Time Span: Duration between edits"
echo "   • Status Change: DRAFT → APPROVED"

echo

echo -e "${YELLOW}🎪 Live Demo URLs:${NC}"
echo "=================="
echo -e "${GREEN}🔗 Resume Document:${NC} http://localhost:3000/documents/cmea9dvgk0021vx8chm8sogur"
echo -e "${GREEN}🔗 Login Page:${NC} http://localhost:3000/login"
echo -e "${GREEN}🔗 Dashboard:${NC} http://localhost:3000/dashboard"

echo

echo -e "${BLUE}📊 Expected Workflow Results:${NC}"
echo "============================="
echo -e "${GREEN}✅ Multi-User Collaboration:${NC}"
echo "   • Multiple users contribute to same document"
echo "   • Each version tracks contributor and changes"
echo "   • Binary diff analytics show cumulative changes"
echo "   • Approval workflow tracks decision points"

echo -e "${GREEN}✅ Binary Diff Benefits:${NC}"
echo "   • Change Attribution: See what each person contributed"
echo "   • Impact Analysis: Quantify each revision's changes"
echo "   • Decision Support: Data-driven approval decisions"
echo "   • Audit Trail: Complete document evolution history"

echo

echo -e "${PURPLE}🏁 Quick Test (10 minutes):${NC}"
echo "=========================="
echo "1. Open 3 browser windows/tabs"
echo "2. Login as different users in each window:"
echo "   • Tab 1: user@richmond-dms.com"
echo "   • Tab 2: manager@richmond-dms.com"
echo "   • Tab 3: admin@richmond-dms.com"
echo "3. Go to Resume document in each tab"
echo "4. User: Download → Edit → Upload (creates version 2)"
echo "5. Manager: Download → Edit → Upload (creates version 3)"  
echo "6. Admin: Approve latest → Publish document"
echo "7. Check Version History for collaborative diff analytics!"

echo

echo -e "${GREEN}🎉 The hybrid binary diff system will track every change"
echo -e "   made by each contributor and show you exactly how the"
echo -e "   document evolved through collaborative editing! 🚀${NC}"

# Offer to open browser
if command -v open >/dev/null 2>&1; then
    echo
    read -p "Open Resume document and login page for testing? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "http://localhost:3000/documents/cmea9dvgk0021vx8chm8sogur"
        sleep 2
        open "http://localhost:3000/login"
        echo -e "${GREEN}🌐 Browser windows opened!${NC}"
        echo -e "${BLUE}   Now test the collaborative workflow with different users!${NC}"
    fi
fi
#!/bin/bash

# Test script for AI-powered Air Force Document Generator
# This script tests the complete AI document generation workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🤖 $1${NC}"
}

print_header "AI Air Force Document Generator - Test Suite"
echo ""

# Test 1: Air Force Manual
print_info "Test 1: Generating Air Force Manual..."
cd backend
DOC_INFO='{
  "instructionTitle": "AIR FORCE INSTRUCTION 1-2", 
  "date": "15 March 2024", 
  "subject": "Commander'\''s Responsibilities", 
  "responsibilities": "LEADERSHIP AND COMMAND",
  "byOrderText": "BY ORDER OF THE",
  "secretaryText": "SECRETARY OF THE AIR FORCE",
  "opr": "SAF/IG",
  "certifiedBy": "AF/CV (General Larry O. Spencer)",
  "pages": 4
}'

node create-ai-afi-document.js "$DOC_INFO" --template af-manual --pages 4 --feedbacks 8
print_status "Air Force Manual test completed"
echo ""

# Test 2: Technical Document
print_info "Test 2: Generating Technical Document..."
DOC_INFO2='{
  "instructionTitle": "AIR FORCE TECHNICAL ORDER 1F-16C-1",
  "date": "1 April 2024",
  "subject": "Aircraft Systems Manual",
  "responsibilities": "MAINTENANCE AND OPERATIONS",
  "opr": "AF/A4",
  "certifiedBy": "AFMC/CC (General Arnold W. Bunch Jr.)",
  "pages": 6
}'

node create-ai-afi-document.js "$DOC_INFO2" --template technical --pages 6 --feedbacks 12
print_status "Technical document test completed"
echo ""

# Test 3: Policy Document
print_info "Test 3: Generating Policy Document..."
DOC_INFO3='{
  "instructionTitle": "AIR FORCE POLICY DIRECTIVE 36-28",
  "date": "28 February 2024",
  "subject": "Awards and Decorations Programs",
  "responsibilities": "PERSONNEL RECOGNITION",
  "opr": "AF/A1",
  "certifiedBy": "SAF/MR (Shon J. Manasco)",
  "pages": 5
}'

node create-ai-afi-document.js "$DOC_INFO3" --template policy --pages 5 --feedbacks 10
print_status "Policy document test completed"
echo ""

cd ..

print_header "All Tests Completed Successfully!"
echo ""
print_info "Generated 3 different Air Force documents:"
print_info "1. Air Force Manual (AFI 1-2) - 4 pages, 8 feedback items"
print_info "2. Technical Order (TO 1F-16C-1) - 6 pages, 12 feedback items"  
print_info "3. Policy Directive (AFPD 36-28) - 5 pages, 10 feedback items"
echo ""
print_info "Access your documents at:"
print_info "🌐 Frontend: http://localhost:3000"
print_info "🤖 AI Generator: http://localhost:3000/ai-document-generator"
print_info "⚡ Workflow Builder: http://localhost:3000/workflow-builder-v2"
echo ""
print_status "AI Air Force Document Generator is working perfectly!"
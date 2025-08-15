# Comprehensive Binary Diff Testing Guide
# Testing with Text, PDF, and Word Documents

This guide tests the hybrid binary diff system with different file types to see how the algorithm performs across various document formats.

## 🎯 **Test Documents Available**

From the system scan, we have these documents ready for testing:

### **📄 Already in System:**
- **Resume.docx** (Word document) - ID: `cmea9dvgk0021vx8chm8sogur` - PERFECT for testing!
- **invoicesample.pdf** (PDF) - Multiple versions available
- **test-document.txt** (Text) - Simple text file
- **Function+List+Blank.xlsx** (Excel) - Spreadsheet document

### **📁 Available in File System:**
- `./Resume.pdf` - PDF version of resume
- `./Resume.docx` - Word version of resume  
- `./test-document.txt` - Created by our test script

## 🧪 **Test Scenarios by File Type**

### **Test 1: Binary Word Document (.docx)**
**Target: Resume.docx (already in system)**

#### **Version 2 - Minor Text Change:**
1. Go to Resume document: http://localhost:3000/documents/cmea9dvgk0021vx8chm8sogur
2. Download the current Resume.docx
3. Open in Word/LibreOffice and make SMALL changes:
   - Fix a typo
   - Add one bullet point to experience
   - Change a date
4. Upload as new version with notes: "Fixed typos and updated experience"
5. **Expected Result:** `MINOR changes | 2-8% changed | 92-98% similarity | 70-90% compression`

#### **Version 3 - Major Content Change:**
1. Download version 2
2. Make SUBSTANTIAL changes:
   - Add a new job experience section
   - Rewrite the summary paragraph
   - Add new skills section
   - Change formatting/styling
3. Upload with notes: "Added new position and expanded skills"
4. **Expected Result:** `MAJOR changes | 10-25% changed | 75-90% similarity | 40-70% compression`

#### **Version 4 - Structural Rewrite:**
1. Download version 3
2. Make MAJOR structural changes:
   - Complete template change
   - Reorder all sections
   - Change from chronological to functional format
   - Add graphics/tables
3. Upload with notes: "Complete resume restructure"
4. **Expected Result:** `STRUCTURAL changes | 30-60% changed | 40-70% similarity | 20-50% compression`

### **Test 2: PDF Document**
**Target: Create new versions of existing PDF**

#### **Using invoicesample.pdf:**
1. Go to invoice document: http://localhost:3000/documents/cmea679pf0003kfg3jlh9sdmf
2. Download the PDF
3. **Edit using PDF editor:**
   - **Minor**: Change a few numbers/dates → `MINOR changes`
   - **Major**: Add new line items, change layout → `MAJOR changes`  
   - **Structural**: Convert to completely different invoice template → `STRUCTURAL`

#### **Expected PDF Results:**
- **Lower compression ratios** than text (30-60%)
- **More sensitive to small changes** due to binary nature
- **Graphics changes** will show as major differences

### **Test 3: Plain Text Document**
**Target: test-document.txt**

#### **High Compression Expected:**
1. Upload the created `test-document.txt`
2. **Version 2**: Add a few sentences → `MINOR | 3-7% | 85-95% compression`
3. **Version 3**: Add new sections → `MAJOR | 15-30% | 70-85% compression`
4. **Version 4**: Rewrite completely → `STRUCTURAL | 50-80% | 60-80% compression`

#### **Expected Text Results:**
- **Highest compression ratios** (70-95%)
- **Most accurate change detection**
- **Best similarity calculations**

### **Test 4: Excel Spreadsheet (.xlsx)**
**Target: Function+List+Blank.xlsx**

1. Download existing Excel file
2. **Minor**: Change a few cell values → `MINOR changes`
3. **Major**: Add new worksheets, formulas → `MAJOR changes`
4. **Structural**: Complete workbook restructure → `STRUCTURAL changes`

## 📊 **Expected Performance by File Type**

### **📝 Text Documents (.txt, .md)**
```
✅ Best Performance:
- Compression: 80-95%
- Accuracy: Excellent
- Speed: Very Fast
- Change Detection: Precise
```

### **📄 Word Documents (.docx)**
```
✅ Good Performance:
- Compression: 60-85%
- Accuracy: Very Good
- Speed: Fast
- Change Detection: Good
- Special: Handles formatting changes well
```

### **📋 PDF Documents (.pdf)**
```
⚠️ Moderate Performance:
- Compression: 30-70%
- Accuracy: Good
- Speed: Moderate
- Change Detection: Sensitive to layout
- Special: Graphics changes show as major
```

### **📊 Spreadsheets (.xlsx, .xls)**
```
✅ Good Performance:
- Compression: 50-80%
- Accuracy: Good
- Speed: Fast  
- Change Detection: Excellent for data
- Special: Formula changes detected well
```

## 🎯 **Step-by-Step Testing Protocol**

### **Phase 1: Resume.docx (Binary Word)**
1. **Navigate to existing Resume:**
   ```
   http://localhost:3000/documents/cmea9dvgk0021vx8chm8sogur
   ```

2. **Download and modify** as described above

3. **Upload new versions** via Document Actions → Edit

4. **Check Version History** for diff analytics

5. **Click Compare buttons** to see detailed statistics

### **Phase 2: Create Test Versions**
```bash
# Go to document detail page
# Look for version history section
# Each version should show:
📊 MINOR changes | 🔢 3.1% changed | 📈 96.9% similarity | 💾 89% compression
[Download] [Compare] [Approve]
```

### **Phase 3: API Testing**
Test the binary diff APIs directly:

```bash
# Get document versions with diff data
curl http://localhost:4000/api/documents/cmea9dvgk0021vx8chm8sogur/versions

# Compare specific versions
curl http://localhost:4000/api/documents/cmea9dvgk0021vx8chm8sogur/versions/compare?from=1&to=2
```

### **Phase 4: Database Verification**
```sql
-- Check binary diff data
SELECT 
  versionNumber,
  changeCategory,
  percentChanged,
  similarity,
  compressionRatio,
  bytesChanged,
  diffSize,
  patchAlgorithm
FROM "DocumentVersion" 
WHERE documentId = 'cmea9dvgk0021vx8chm8sogur'
ORDER BY versionNumber;
```

## 🔍 **What to Look For**

### **✅ Success Indicators:**
- Color-coded change category chips appear
- Compression ratios make sense for file type
- Similarity scores are logical (high for minor changes)
- Compare button shows detailed statistics
- Backend logs show "Binary diff generated successfully"

### **📊 Performance Expectations:**
- **Word docs**: 60-85% compression, good change detection
- **PDFs**: 30-70% compression, sensitive to layout changes
- **Text**: 80-95% compression, excellent accuracy
- **Excel**: 50-80% compression, good data change detection

### **🚨 Troubleshooting:**
- No diff analytics? Check backend logs for bsdiff errors
- Low compression? Normal for binary files with graphics
- Compare button not working? Refresh page, check console

## 🎪 **Live Testing Right Now**

**Start with Resume.docx (easiest to test):**

1. Go to: http://localhost:3000/documents/cmea9dvgk0021vx8chm8sogur
2. Download Resume.docx
3. Make a small change (add one word)
4. Document Actions → Edit → Upload modified file
5. Check Version History for diff analytics!

**You'll immediately see the binary diff in action with colorful analytics showing exactly how the Word document changed!**

This comprehensive test covers all major document types and will show you how the hybrid binary diff system performs across different file formats. 🚀
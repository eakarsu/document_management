# Testing the Hybrid Document Versioning System
# Richmond Document Management System

This guide shows you how to test and see the binary diff functionality in action.

## 🚀 **Prerequisites**

1. Make sure system is running:
```bash
./start.sh --status
```

2. Open browser to http://localhost:3000
3. Login with demo credentials:
   - Admin: admin@richmond-dms.com / admin123
   - Manager: manager@richmond-dms.com / manager123
   - User: user@richmond-dms.com / user123

## 📝 **Test Scenario 1: Document Version Creation**

### Step 1: Upload Initial Document
1. Click "Upload Document" in dashboard
2. Choose a Word document (.docx) or PDF
3. Fill in title: "Test Document for Binary Diff"
4. Category: "Testing"
5. Upload and note the document ID

### Step 2: Create Test Versions
Now we'll create modified versions to see diff analytics:

**Version 2 (Minor Change):**
1. Download the document from the system
2. Make a small change (add 1-2 sentences)
3. Save the file
4. Go to document detail page → Document Actions → Edit
5. Upload the modified version
6. Change notes: "Added introduction paragraph"
7. Change type: "MINOR"

**Version 3 (Major Change):**
1. Download version 2
2. Make significant changes (add/remove paragraphs, change formatting)
3. Upload as new version
4. Change notes: "Restructured content and added new sections"
5. Change type: "MAJOR"

**Version 4 (Structural Change):**
1. Download version 3
2. Make major structural changes (completely reorganize, change document type)
3. Upload as new version
4. Change notes: "Complete document restructure"
5. Change type: "MAJOR"

## 👁️ **What You'll See in Version History**

Navigate to the document detail page and scroll to "Version History" section:

### **Visual Diff Indicators:**

```
Version 4 (Latest) - STRUCTURAL changes
📊 STRUCTURAL changes | 🔢 45.2% changed | 📈 54.8% similarity | 💾 23% compression
[Download] [Compare] [Approve]

Version 3 - MAJOR changes  
📊 MAJOR changes | 🔢 18.7% changed | 📈 81.3% similarity | 💾 67% compression
[Download] [Compare]

Version 2 - MINOR changes
📊 MINOR changes | 🔢 3.1% changed | 📈 96.9% similarity | 💾 89% compression  
[Download] [Compare]

Version 1 (Original)
📄 Original document
[Download]
```

### **Compare Button Details:**
Click "Compare" on any version to see:

```
Version 4 vs Version 3:

• Change Category: STRUCTURAL
• Bytes Changed: 15.2KB
• Percent Changed: 45.2%
• Similarity: 54.8%
• Compression Ratio: 23%

Diff Algorithm: bsdiff
```

## 🔧 **Test Scenario 2: API Testing**

Test the binary diff API endpoints directly:

### **1. List Document Versions:**
```bash
curl http://localhost:4000/api/documents/{document-id}/versions
```

### **2. Compare Specific Versions:**
```bash
curl http://localhost:4000/api/documents/{document-id}/versions/compare?from=1&to=3
```

### **3. Get Diff Statistics:**
```bash
curl http://localhost:4000/api/documents/{document-id}/versions/3
```

## 📊 **Test Scenario 3: Different File Types**

Test with various document types to see how binary diff performs:

### **Text Documents (.docx, .doc):**
- Expected: High compression ratios (70-90%)
- Best for: Content changes, formatting modifications

### **PDFs:**
- Expected: Medium compression ratios (40-70%)
- Best for: Text changes, some structural modifications

### **Spreadsheets (.xlsx):**
- Expected: High compression ratios (60-85%)
- Best for: Cell value changes, formula modifications

### **Images (within documents):**
- Expected: Lower compression ratios (10-40%)
- Best for: Small image changes, embedded content

## 🎯 **Expected Results by Change Type**

### **MINOR Changes (< 5%):**
```
- Typo fixes
- Small text additions
- Formatting tweaks
- Color changes
Compression: 80-95%
Similarity: 95-100%
```

### **MAJOR Changes (5-25%):**
```
- New paragraphs/sections
- Content reorganization  
- Style modifications
- Data additions
Compression: 50-80%
Similarity: 75-95%
```

### **STRUCTURAL Changes (> 25%):**
```
- Complete rewrites
- Document type changes
- Major reorganization
- Template changes
Compression: 20-60%
Similarity: 40-75%
```

## 🔍 **Database Verification**

Check the database to see stored diff data:

```sql
-- Connect to PostgreSQL
psql -d dms_dev

-- View document versions with binary diff data
SELECT 
  id,
  versionNumber,
  changeCategory,
  percentChanged,
  similarity,
  compressionRatio,
  bytesChanged,
  diffSize,
  patchAlgorithm
FROM "DocumentVersion" 
WHERE documentId = 'your-document-id'
ORDER BY versionNumber;
```

## 📈 **Performance Testing**

### **Storage Efficiency:**
Monitor how much space is saved:

```bash
# Check document storage size
ls -la backend/uploads/documents/

# Check diff storage size  
ls -la backend/uploads/diffs/
```

### **Diff Generation Time:**
Check backend logs for timing:

```bash
tail -f backend.log | grep "Binary diff generated"
```

Look for logs like:
```
Binary diff generated successfully: {
  documentId: "...",
  toVersion: 3,
  diffSize: 12480,
  compressionRatio: 0.67,
  changeCategory: "MAJOR"
}
```

## 🎨 **Visual Testing Checklist**

- [ ] Color-coded change category chips
- [ ] Percentage changed indicators
- [ ] Similarity scores display
- [ ] Compression ratio information
- [ ] Compare button functionality
- [ ] Download original versions
- [ ] Workflow status integration

## 🚨 **Troubleshooting**

### **If Diff Analytics Don't Show:**
1. Check backend logs: `tail -f backend.log`
2. Verify binary diff service: Look for "bsdiff" errors
3. Check database: Ensure `diffSize` and other fields are populated
4. Try with different file types

### **If Compare Button Doesn't Work:**
1. Check frontend console for errors
2. Verify version has `bytesChanged` data
3. Refresh page and try again

### **Storage Issues:**
1. Check MinIO/file storage connectivity
2. Verify upload permissions
3. Monitor disk space

## 📋 **Success Criteria**

✅ **System Working If:**
- Version history shows diff analytics chips
- Compare button provides detailed statistics  
- Different change categories display correctly
- Compression ratios make sense for change types
- Database contains binary diff metadata
- File downloads work for all versions

This hybrid system gives you both the reliability of complete file storage AND the intelligence of binary diff analysis!
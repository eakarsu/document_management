const { PrismaClient } = require('@prisma/client');
const { Client: ElasticsearchClient } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const prisma = new PrismaClient();
const elasticsearch = new ElasticsearchClient({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

const indexName = 'dms-documents';

// Extract text content from files
async function extractTextContent(filePath, mimeType) {
  try {
    console.log('🔍 Starting text extraction for:', filePath, 'Type:', mimeType);
    
    // Check if file exists locally
    if (!fs.existsSync(filePath)) {
      console.log('⚠️ File not found locally:', filePath);
      
      // Try to find it in uploads directory
      const fileName = path.basename(filePath);
      const uploadsPath = path.join(__dirname, 'uploads', fileName);
      
      if (fs.existsSync(uploadsPath)) {
        console.log('✅ Found file in uploads directory:', uploadsPath);
        filePath = uploadsPath;
      } else {
        console.log('❌ File not found in uploads either:', uploadsPath);
        return '';
      }
    }
    
    // Handle text files
    if (mimeType === 'text/plain' || mimeType.startsWith('text/')) {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log('✅ Text file extracted, length:', content.length);
      return content.substring(0, 50000); // Limit to 50KB
    }
    
    // Handle CSV files
    if (mimeType === 'text/csv') {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log('✅ CSV file extracted, length:', content.length);
      return content.substring(0, 50000);
    }
    
    // Handle Excel files with XLSX
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        mimeType === 'application/vnd.ms-excel') {
      console.log('📊 Processing Excel file with XLSX');
      try {
        const workbook = XLSX.readFile(filePath);
        let extractedText = '';
        
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_csv(sheet);
          extractedText += `Sheet: ${sheetName}\n${sheetData}\n\n`;
        });
        
        console.log('✅ Excel file extracted, length:', extractedText.length);
        return extractedText.substring(0, 50000);
      } catch (xlsxError) {
        console.error('❌ XLSX extraction failed:', xlsxError.message);
      }
    }
    
    // Handle PDF files with pdftotext
    if (mimeType === 'application/pdf') {
      console.log('📄 Processing PDF with pdftotext');
      
      try {
        const { stdout, stderr } = await execPromise(`pdftotext "${filePath}" -`);
        
        if (stderr && !stderr.includes('Warning')) {
          console.log('pdftotext stderr:', stderr);
        }
        
        if (stdout && stdout.length > 0) {
          console.log('✅ PDF extracted with pdftotext, length:', stdout.length);
          return stdout.substring(0, 50000);
        } else {
          console.log('⚠️ pdftotext returned empty, trying LibreOffice');
          
          // Fallback to LibreOffice
          const tempTxtFile = `/tmp/${path.basename(filePath, '.pdf')}.txt`;
          const { stdout: loStdout, stderr: loStderr } = await execPromise(
            `soffice --headless --convert-to txt:Text --outdir /tmp "${filePath}" 2>&1`
          );
          
          if (fs.existsSync(tempTxtFile)) {
            const content = fs.readFileSync(tempTxtFile, 'utf8');
            fs.unlinkSync(tempTxtFile); // Clean up
            console.log('✅ PDF extracted with LibreOffice, length:', content.length);
            return content.substring(0, 50000);
          }
        }
      } catch (pdfError) {
        console.error('❌ PDF extraction failed:', pdfError.message);
      }
    }
    
    // Handle Word, PPT, and other documents with LibreOffice
    const supportedByLibreOffice = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/rtf'
    ];
    
    if (supportedByLibreOffice.includes(mimeType)) {
      console.log('📄 Processing document with LibreOffice:', mimeType);
      
      try {
        const outputFileName = path.basename(filePath, path.extname(filePath)) + '.txt';
        const outputPath = `/tmp/${outputFileName}`;
        
        // Convert to text using LibreOffice
        const command = `soffice --headless --convert-to txt:Text --outdir /tmp "${filePath}"`;
        console.log('Running command:', command);
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Overwriting')) {
          console.log('LibreOffice stderr:', stderr);
        }
        
        // Read the converted text file
        if (fs.existsSync(outputPath)) {
          const content = fs.readFileSync(outputPath, 'utf8');
          console.log('✅ LibreOffice extracted text, length:', content.length);
          
          // Clean up temp file
          try {
            fs.unlinkSync(outputPath);
          } catch (e) {
            console.log('Could not delete temp file:', outputPath);
          }
          
          return content.substring(0, 50000);
        } else {
          console.log('❌ LibreOffice output file not found:', outputPath);
        }
      } catch (libreError) {
        console.error('❌ LibreOffice extraction failed:', libreError.message);
      }
    }
    
    // For unsupported types, return filename
    console.log('⚠️ Unsupported file type, using filename as content');
    return path.basename(filePath);
    
  } catch (error) {
    console.error('❌ Text extraction failed:', error.message);
    return '';
  }
}

async function reindexAllDocuments() {
  try {
    console.log('🚀 Starting improved document reindexing with better PDF support...\n');
    
    // Get all documents from database
    const documents = await prisma.document.findMany({
      include: {
        createdBy: true
      }
    });
    
    console.log(`Found ${documents.length} documents to reindex\n`);
    
    let successCount = 0;
    let failCount = 0;
    let contentFoundCount = 0;
    
    for (const doc of documents) {
      try {
        console.log(`\n📋 Processing document: ${doc.id}`);
        console.log(`   Title: ${doc.title}`);
        console.log(`   File: ${doc.fileName}`);
        console.log(`   Type: ${doc.mimeType}`);
        console.log(`   Storage Path: ${doc.storagePath}`);
        
        // Extract text content
        const extractedContent = await extractTextContent(doc.storagePath, doc.mimeType);
        const content = doc.ocrText || extractedContent || '';
        
        console.log(`   Extracted content length: ${content.length} characters`);
        if (content.length > 0) {
          console.log(`   Content preview: ${content.substring(0, 100).replace(/\n/g, ' ')}...`);
          contentFoundCount++;
        }
        
        // Index document in Elasticsearch
        await elasticsearch.index({
          index: indexName,
          id: doc.id,
          body: {
            id: doc.id,
            title: doc.title,
            content: content,
            organizationId: doc.organizationId,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            metadata: {
              category: doc.category,
              tags: doc.tags,
              mimeType: doc.mimeType,
              fileName: doc.fileName,
              originalName: doc.originalName,
              customFields: doc.customFields
            }
          }
        });
        
        console.log(`   ✅ Successfully indexed document ${doc.id}`);
        successCount++;
        
      } catch (docError) {
        console.error(`   ❌ Failed to index document ${doc.id}:`, docError.message);
        failCount++;
      }
    }
    
    // Refresh index to make documents searchable
    await elasticsearch.indices.refresh({ index: indexName });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Reindexing Complete!');
    console.log(`✅ Successfully indexed: ${successCount} documents`);
    console.log(`📄 Documents with content: ${contentFoundCount}`);
    console.log(`❌ Failed: ${failCount} documents`);
    console.log('='.repeat(50) + '\n');
    
    // Test search for various terms
    console.log('🔍 Testing search functionality...\n');
    
    const testQueries = ['apple', 'visitor', 'Erol', 'financial', 'invoice', 'Richmond'];
    
    for (const query of testQueries) {
      const searchResult = await elasticsearch.search({
        index: indexName,
        body: {
          query: {
            multi_match: {
              query: query,
              fields: ['title^3', 'content^2', 'metadata.fileName^2'],
              type: 'best_fields',
              fuzziness: 'AUTO'
            }
          },
          size: 5,
          _source: ['id', 'title']
        }
      });
      
      const hits = searchResult.body?.hits?.hits || searchResult.hits?.hits || [];
      console.log(`Search for "${query}": Found ${hits.length} results`);
      if (hits.length > 0) {
        hits.forEach(hit => {
          console.log(`  - ${hit._source.title} (${hit._source.id})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Reindexing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reindexing
reindexAllDocuments();
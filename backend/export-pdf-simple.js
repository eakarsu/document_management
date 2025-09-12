const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function exportToPDF() {
  console.log('Starting PDF export...');
  
  try {
    // Read the HTML document
    const htmlPath = path.join(__dirname, 'long_document_output.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // Launch puppeteer
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content
    console.log('Setting HTML content...');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    console.log('Generating PDF...');
    const pdfPath = path.join(__dirname, 'AIR_FORCE_INSTRUCTION_36-2903.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true,
      displayHeaderFooter: false
    });
    
    await browser.close();
    
    console.log('✅ PDF exported successfully!');
    console.log(`📄 File saved to: ${pdfPath}`);
    console.log(`📊 File size: ${(fs.statSync(pdfPath).size / 1024).toFixed(2)} KB`);
    console.log('\nYou can now open the PDF file to view your Air Force document with all formatting preserved!');
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
  }
}

exportToPDF();
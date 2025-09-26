import express, { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = express.Router();
const execAsync = promisify(exec);

// Perfect DOCX export - using PDF as intermediate format
router.post('/docx-perfect', async (req: Request, res: Response) => {
  try {
    const { html, title } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // Step 1: Generate perfect PDF using Puppeteer (same as PDF export)
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with perfect rendering
    const pdfBuffer = await page.pdf({
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

    // Step 2: Save PDF to temp file
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const pdfPath = path.join(tempDir, `temp_${timestamp}.pdf`);
    const docxPath = path.join(tempDir, `temp_${timestamp}.docx`);
    
    fs.writeFileSync(pdfPath, pdfBuffer);

    try {
      // Step 3: Convert PDF to DOCX using LibreOffice
      // LibreOffice command for PDF to DOCX conversion
      const command = `soffice --headless --convert-to docx:"MS Word 2007 XML" --outdir "${tempDir}" "${pdfPath}"`;
      
      console.log('Converting PDF to DOCX with LibreOffice...');
      await execAsync(command);
      
      // Check if DOCX was created
      if (fs.existsSync(docxPath)) {
        // Read the DOCX file
        const docxBuffer = fs.readFileSync(docxPath);
        
        // Clean up temp files
        fs.unlinkSync(pdfPath);
        fs.unlinkSync(docxPath);
        
        // Send DOCX
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${title || 'document'}.docx"`);
        res.end(docxBuffer);
      } else {
        // If LibreOffice conversion failed, send the PDF instead
        console.log('DOCX conversion failed, sending PDF as fallback');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${title || 'document'}.pdf"`);
        res.end(pdfBuffer);
      }
    } catch (conversionError) {
      console.error('LibreOffice conversion error:', conversionError);
      
      // Clean up temp file if it exists
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
      
      // Send PDF as fallback
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${title || 'document'}.pdf"`);
      res.end(pdfBuffer);
    }
    
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

export default router;
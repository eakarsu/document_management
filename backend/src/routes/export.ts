import express, { Request, Response } from 'express';
import puppeteer from 'puppeteer';
// @ts-ignore - no types available for html-to-docx
import HTMLtoDOCX from 'html-to-docx';
import { authMiddleware } from '../middleware/auth';
import libre from 'libreoffice-convert';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const libreConvert = promisify(libre.convert);

const router = express.Router();

// Apply auth middleware - commented out for testing
// router.use(authMiddleware);

// Export as PDF
router.post('/pdf', async (req: Request, res: Response) => {
  try {
    const { html, title } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
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
    
    // Send PDF as buffer, not JSON
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${title || 'document'}.pdf"`);
    res.end(pdfBuffer);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Export as DOCX - Using LibreOffice for better quality conversion
router.post('/docx', async (req: Request, res: Response) => {
  try {
    const { html, title } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    try {
      // Try LibreOffice conversion first (better quality)
      // Create temp file for HTML
      const tempDir = os.tmpdir();
      const htmlFile = path.join(tempDir, `temp_${Date.now()}.html`);
      
      // Write HTML to temp file
      fs.writeFileSync(htmlFile, html);
      
      // Read HTML file as buffer
      const htmlBuffer = fs.readFileSync(htmlFile);
      
      // Convert using LibreOffice
      const docxBuffer = await libreConvert(htmlBuffer, '.docx', undefined);
      
      // Clean up temp file
      fs.unlinkSync(htmlFile);
      
      // Send DOCX as buffer
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${title || 'document'}.docx"`);
      res.end(docxBuffer);
      
    } catch (libreError) {
      console.log('LibreOffice not available, falling back to html-to-docx');
      
      // Fallback to html-to-docx if LibreOffice is not available
      const docxBuffer = await HTMLtoDOCX(html, null, {
        table: { row: { cantSplit: true } },
        footer: false,
        pageNumber: false,
        font: 'Times New Roman',
        fontSize: 12,
        margins: {
          top: 720, // 0.5 inch
          right: 720,
          bottom: 720,
          left: 720
        }
      });
      
      // Send DOCX as buffer
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${title || 'document'}.docx"`);
      res.end(Buffer.from(docxBuffer));
    }
    
  } catch (error) {
    console.error('DOCX generation error:', error);
    res.status(500).json({ error: 'Failed to generate DOCX' });
  }
});

export default router;
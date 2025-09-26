import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

router.get('/api/headers/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const headersDir = path.join(__dirname, '../../headers');
    const headerFile = path.join(headersDir, `${templateId}-header.html`);

    if (!fs.existsSync(headerFile)) {
      return res.status(404).json({
        error: 'Header template not found',
        templateId
      });
    }

    const headerContent = fs.readFileSync(headerFile, 'utf8');

    res.json({
      success: true,
      templateId,
      headerContent
    });
  } catch (error) {
    console.error('Error fetching header:', error);
    res.status(500).json({
      error: 'Failed to fetch header template'
    });
  }
});

router.get('/api/headers', async (req: Request, res: Response) => {
  try {
    const headersDir = path.join(__dirname, '../../headers');

    if (!fs.existsSync(headersDir)) {
      return res.json({
        success: true,
        headers: []
      });
    }

    const files = fs.readdirSync(headersDir)
      .filter(file => file.endsWith('-header.html'))
      .map(file => file.replace('-header.html', ''));

    res.json({
      success: true,
      headers: files
    });
  } catch (error) {
    console.error('Error listing headers:', error);
    res.status(500).json({
      error: 'Failed to list header templates'
    });
  }
});

export default router;
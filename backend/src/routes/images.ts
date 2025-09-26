import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Serve seal images
router.get('/:imageName', (req: Request, res: Response) => {
  const { imageName } = req.params;

  // Security: Only allow specific image names
  const allowedImages = [
    'air-force-seal.png',
    'army-seal.png',
    'dod-seal.png',
    'joint-chiefs-seal.png',
    'marine-corps-seal.png',
    'navy-seal.png',
    'space-force-seal.png'
  ];

  if (!allowedImages.includes(imageName)) {
    return res.status(404).json({ error: 'Image not found' });
  }

  // Path to frontend public images
  const imagePath = path.join(__dirname, '../../../../frontend/public/images', imageName);

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image file not found' });
  }

  // Set proper content type
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

  // Send the image
  const imageStream = fs.createReadStream(imagePath);
  imageStream.pipe(res);
});

export default router;
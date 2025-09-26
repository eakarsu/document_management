#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function optimizeAndConvert() {
  const imagesDir = path.join(__dirname, '../frontend/public/images');
  const tempDir = path.join(__dirname, 'temp-images');

  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const images = [
    'air-force-seal.png',
    'army-seal.png',
    'dod-seal.png',
    'joint-chiefs-seal.png',
    'marine-corps-seal.png',
    'navy-seal.png',
    'space-force-seal.png'
  ];

  const base64Images = {};

  console.log('Creating optimized base64 images...');

  for (const imageName of images) {
    const inputPath = path.join(imagesDir, imageName);
    const tempPath = path.join(tempDir, imageName);

    if (fs.existsSync(inputPath)) {
      try {
        // Use sips (macOS built-in) to resize image to 100x100
        await execPromise(`sips -Z 100 "${inputPath}" --out "${tempPath}"`);

        // Read optimized image
        const imageBuffer = fs.readFileSync(tempPath);
        const base64 = imageBuffer.toString('base64');
        const key = imageName.replace('-seal.png', '');
        base64Images[key] = `data:image/png;base64,${base64}`;

        console.log(`✅ Optimized ${imageName} - ${Math.round(imageBuffer.length / 1024)}KB`);
      } catch (error) {
        console.log(`❌ Failed to optimize ${imageName}:`, error.message);
        // Fallback to original
        const imageBuffer = fs.readFileSync(inputPath);
        const base64 = imageBuffer.toString('base64');
        const key = imageName.replace('-seal.png', '');
        base64Images[key] = `data:image/png;base64,${base64}`;
      }
    }
  }

  // Clean up temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }

  // Write optimized base64
  const outputContent = `// Optimized base64 seal images (100x100px)
// Generated on ${new Date().toISOString()}

module.exports = ${JSON.stringify(base64Images, null, 2)};
`;

  fs.writeFileSync(path.join(__dirname, 'seal-images-optimized.js'), outputContent);
  console.log('\n✅ Optimized base64 images saved to: seal-images-optimized.js');

  // Show size comparison
  const originalSize = fs.statSync(path.join(__dirname, 'seal-images-base64.js')).size;
  const optimizedSize = fs.statSync(path.join(__dirname, 'seal-images-optimized.js')).size;
  console.log(`📊 Size reduction: ${Math.round((1 - optimizedSize/originalSize) * 100)}%`);
}

optimizeAndConvert().catch(console.error);
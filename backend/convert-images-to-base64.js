#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Convert images to base64
const imagesDir = path.join(__dirname, '../frontend/public/images');
const outputFile = path.join(__dirname, 'seal-images-base64.js');

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

console.log('Converting seal images to base64...');

images.forEach(imageName => {
  const imagePath = path.join(imagesDir, imageName);
  if (fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const key = imageName.replace('-seal.png', '');
    base64Images[key] = `data:image/png;base64,${base64}`;
    console.log(`✅ Converted ${imageName}`);
  } else {
    console.log(`❌ Image not found: ${imageName}`);
  }
});

// Write to file
const outputContent = `// Auto-generated base64 seal images
// Generated on ${new Date().toISOString()}

module.exports = ${JSON.stringify(base64Images, null, 2)};
`;

fs.writeFileSync(outputFile, outputContent);
console.log(`\n✅ Base64 images saved to: ${outputFile}`);
console.log('Images converted:', Object.keys(base64Images).join(', '));
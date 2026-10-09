import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const distDir = path.resolve('dist');
const zip = new JSZip();

function addDirToZip(currentDir, relativePath = '') {
  const items = fs.readdirSync(currentDir);
  for (const item of items) {
    if (item.endsWith('.zip')) continue; // Skip existing zip files
    const fullPath = path.join(currentDir, item);
    const zipPath = relativePath ? `${relativePath}/${item}` : item;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDirToZip(fullPath, zipPath);
    } else {
      zip.file(zipPath, fs.readFileSync(fullPath));
    }
  }
}

async function run() {
  console.log('Adding files from dist/ to zip...');
  addDirToZip(distDir);
  console.log('Generating zip buffer...');
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const publicDest = path.resolve('public/indianalala_hostinger_build.zip');
  const distDest = path.resolve('dist/indianalala_hostinger_build.zip');
  fs.writeFileSync(publicDest, buffer);
  fs.writeFileSync(distDest, buffer);
  console.log(`Updated Hostinger zip created successfully (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
}

run().catch((err) => {
  console.error('Error creating zip:', err);
  process.exit(1);
});

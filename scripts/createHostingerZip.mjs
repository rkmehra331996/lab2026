import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const rootDir = path.resolve('.');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

function addDirToZip(zip, currentDir, relativePath = '') {
  const items = fs.readdirSync(currentDir);
  for (const item of items) {
    if (item.endsWith('.zip')) continue; // Skip existing zip files
    const fullPath = path.join(currentDir, item);
    const zipPath = relativePath ? `${relativePath}/${item}` : item;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDirToZip(zip, fullPath, zipPath);
    } else {
      zip.file(zipPath, fs.readFileSync(fullPath));
    }
  }
}

async function run() {
  if (!fs.existsSync(distDir)) {
    console.error(`[ERROR] Dist directory '${distDir}' not found.`);
    process.exit(1);
  }

  // Ensure public/.htaccess is present in dist
  const htaccessSrc = path.join(publicDir, '.htaccess');
  const htaccessDst = path.join(distDir, '.htaccess');
  if (fs.existsSync(htaccessSrc) && !fs.existsSync(htaccessDst)) {
    fs.copyFileSync(htaccessSrc, htaccessDst);
  }

  console.log('Adding files from dist/ to zip...');
  const zip = new JSZip();
  addDirToZip(zip, distDir);

  console.log('Generating zip buffer...');
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const rootZip = path.join(rootDir, 'hostinger_public_html.zip');
  const publicDest = path.join(publicDir, 'indianalala_hostinger_build.zip');
  const distDest = path.join(distDir, 'indianalala_hostinger_build.zip');

  fs.writeFileSync(rootZip, buffer);
  fs.writeFileSync(publicDest, buffer);
  fs.writeFileSync(distDest, buffer);

  const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
  console.log(`✅ Successfully packaged Hostinger zip archives (${sizeMb} MB):`);
  console.log(`   1. ${rootZip}`);
  console.log(`   2. ${publicDest}`);
  console.log(`   3. ${distDest}`);
}

run().catch((err) => {
  console.error('Error creating zip:', err);
  process.exit(1);
});

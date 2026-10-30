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

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

async function run() {
  if (!fs.existsSync(distDir)) {
    console.error(`[ERROR] Dist directory '${distDir}' not found.`);
    process.exit(1);
  }

  // 1. Ensure fresh public/.htaccess is copied to dist
  const htaccessSrc = path.join(publicDir, '.htaccess');
  const htaccessDst = path.join(distDir, '.htaccess');
  if (fs.existsSync(htaccessSrc)) {
    fs.copyFileSync(htaccessSrc, htaccessDst);
  }

  // 2. Ensure fresh public/api is copied to dist/api
  const apiSrc = path.join(publicDir, 'api');
  const apiDst = path.join(distDir, 'api');
  if (fs.existsSync(apiSrc)) {
    copyRecursiveSync(apiSrc, apiDst);
  }

  // 3. Ensure uploads folder is copied
  const uploadsSrc = path.join(publicDir, 'uploads');
  const uploadsDst = path.join(distDir, 'uploads');
  if (fs.existsSync(uploadsSrc)) {
    copyRecursiveSync(uploadsSrc, uploadsDst);
  }

  // 4. Ensure SQL schema and Setup Guide are copied to dist for Hostinger import
  const sqlSrc = path.join(rootDir, 'hostinger_database_schema.sql');
  const sqlDst = path.join(distDir, 'hostinger_database_schema.sql');
  if (fs.existsSync(sqlSrc)) {
    fs.copyFileSync(sqlSrc, sqlDst);
  }

  const guideSrc = path.join(rootDir, 'HOSTINGER_DATABASE_SETUP_GUIDE.md');
  const guideDst = path.join(distDir, 'HOSTINGER_DATABASE_SETUP_GUIDE.md');
  if (fs.existsSync(guideSrc)) {
    fs.copyFileSync(guideSrc, guideDst);
  }

  // Clean existing zips in dist to prevent bundling into self
  for (const item of fs.readdirSync(distDir)) {
    if (item.endsWith('.zip')) {
      try { fs.unlinkSync(path.join(distDir, item)); } catch {}
    }
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
  const publicHostingerZip = path.join(publicDir, 'hostinger_public_html.zip');
  const distHostingerZip = path.join(distDir, 'hostinger_public_html.zip');

  fs.writeFileSync(rootZip, buffer);
  fs.writeFileSync(publicDest, buffer);
  fs.writeFileSync(distDest, buffer);
  fs.writeFileSync(publicHostingerZip, buffer);
  fs.writeFileSync(distHostingerZip, buffer);

  const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
  console.log(`✅ Successfully packaged Hostinger zip archives (${sizeMb} MB):`);
  console.log(`   1. ${rootZip}`);
  console.log(`   2. ${publicDest}`);
  console.log(`   3. ${distDest}`);
  console.log(`   4. ${publicHostingerZip}`);
  console.log(`   5. ${distHostingerZip}`);
}

run().catch((err) => {
  console.error('Error creating zip:', err);
  process.exit(1);
});

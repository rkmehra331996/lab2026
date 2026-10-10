import 'dotenv/config';
process.env.DISABLE_HMR = 'true';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'hostinger_dev_db.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure data & uploads directories exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to read data
function readDevDb(): Record<string, any> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const store = JSON.parse(raw);
      // Ensure 6 shops are always present
      if (!store.vendorLabs || store.vendorLabs.length === 0 || !store.vendor_labs || store.vendor_labs.length === 0) {
        const seedLabsPath = path.join(__dirname, 'public', 'api', 'data', 'vendor_labs.json');
        if (fs.existsSync(seedLabsPath)) {
          const labs = JSON.parse(fs.readFileSync(seedLabsPath, 'utf-8'));
          store.vendorLabs = labs;
          store.vendor_labs = labs;
        }
      }
      return store;
    }
  } catch (err) {
    console.warn('[Dev Server DB Read Error]:', err);
  }

  // Fallback to initial seed files
  let seedLabs: any[] = [];
  const seedLabsPath = path.join(__dirname, 'public', 'api', 'data', 'vendor_labs.json');
  if (fs.existsSync(seedLabsPath)) {
    try {
      seedLabs = JSON.parse(fs.readFileSync(seedLabsPath, 'utf-8'));
    } catch {}
  }

  let seedSettings: any = {};
  const seedSettingsPath = path.join(__dirname, 'public', 'api', 'data', 'lab_settings.json');
  if (fs.existsSync(seedSettingsPath)) {
    try {
      const arr = JSON.parse(fs.readFileSync(seedSettingsPath, 'utf-8'));
      if (Array.isArray(arr)) {
        for (const s of arr) {
          const id = s.labId || s.id;
          seedSettings[id] = s;
        }
      }
    } catch {}
  }

  return {
    labSettingsMap: seedSettings,
    lab_settings: seedSettings,
    tests: [],
    packages: [],
    doctors: [],
    branches: [],
    receptionEntries: [],
    reports: [],
    bookings: [],
    staff: [],
    vendorLabs: seedLabs,
    vendor_labs: seedLabs,
    companySettings: null,
    seoSettings: null,
    portalSections: null,
    domainRequests: [],
    contactSubmissions: [],
    pricingPlans: [],
    planRequests: [],
    _lastUpdated: new Date().toISOString(),
  };
}

// Helper to write data
function writeDevDb(data: Record<string, any>): boolean {
  try {
    data._lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Dev Server DB Write Error]:', err);
    return false;
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS for dev/preview testing across different ports/origins
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Static serving for Hostinger uploads directory
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Build Zip Download: Hostinger Build Zip (Always fresh latest updated version)
  app.get(
    [
      '/indianalala_hostinger_build.zip',
      '/hostinger_public_html.zip',
      '/api/download-build',
      '/api/download-hostinger-build',
    ],
    (req, res) => {
      try {
        const rootDir = __dirname;
        const distIndex = path.join(rootDir, 'dist', 'index.html');
        const srcDir = path.join(rootDir, 'src');

        let needsRebuild = false;
        if (!fs.existsSync(distIndex)) {
          needsRebuild = true;
        } else {
          const distMtime = fs.statSync(distIndex).mtimeMs;
          const checkDir = (dir: string): boolean => {
            if (!fs.existsSync(dir)) return false;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                if (checkDir(fullPath)) return true;
              } else {
                const stat = fs.statSync(fullPath);
                if (stat.mtimeMs > distMtime) return true;
              }
            }
            return false;
          };
          needsRebuild = checkDir(srcDir);
        }

        if (needsRebuild) {
          console.log('[Hostinger Build] Rebuilding updated software distribution package...');
          execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
        } else {
          try {
            execSync('python3 scripts/package-hostinger.py', { cwd: rootDir, stdio: 'inherit' });
          } catch {}
        }

        const targetZip = path.join(rootDir, 'public', 'indianalala_hostinger_build.zip');
        if (fs.existsSync(targetZip)) {
          const stat = fs.statSync(targetZip);
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', 'attachment; filename="indianalala_hostinger_build.zip"');
          res.setHeader('Content-Length', stat.size);
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          const stream = fs.createReadStream(targetZip);
          stream.pipe(res);
          return;
        }
      } catch (err: any) {
        console.error('[Hostinger Download Error]:', err);
      }
      res.status(500).json({ error: 'Failed to prepare build zip' });
    }
  );

  // 1. Health check & Ping
  app.get(['/api/sync/ping', '/api/ping'], (req, res) => {
    res.json({
      success: true,
      mode: 'express_hostinger',
      message: 'IndianLalaji Hostinger Backend Emulation Active',
      timestamp: new Date().toISOString(),
      version: '3.5.0-hostinger'
    });
  });

  // 2. Hostinger Server & Database Status
  app.get(['/api/status', '/api/status.php'], (req, res) => {
    const uploadFiles = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : [];
    res.json({
      status: 'online',
      server: 'Hostinger Web Hosting & MySQL Database (Primary)',
      database: 'Hostinger MySQL Database (u873216892_healthcare)',
      storage: 'Hostinger Server Storage (public/uploads)',
      storageMode: 'hostinger_filesystem',
      uploadsCount: uploadFiles.length,
      timestamp: new Date().toISOString(),
      version: '3.5.0-hostinger'
    });
  });

  // Robots.txt dynamic serving from Super Admin SEO Settings
  app.get('/robots.txt', (_req, res) => {
    const store = readDevDb();
    const seo = store.seo_settings || store.seoSettings;
    const defaultRobots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /technician
Disallow: /reception

Sitemap: https://indianlalaji.com/sitemap.xml`;
    const robotsContent = seo?.robotsTxt || defaultRobots;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(robotsContent);
  });

  // 3. Image & File Upload Endpoint (Saves to Hostinger Server Storage)
  app.post(['/api/upload', '/api/upload.php'], (req, res) => {
    const body = req.body || {};
    const action = req.query.action || body.action;

    // A. Image Deletion
    if (action === 'delete_image' || action === 'delete') {
      const targetUrl = body.url || body.filePath;
      if (targetUrl) {
        try {
          const filename = path.basename(new URL(targetUrl, 'http://localhost').pathname);
          if (filename && /^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
            const filePath = path.join(UPLOADS_DIR, filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        } catch (err) {
          console.warn('Error deleting old image:', err);
        }
      }
      return res.json({
        status: 'success',
        message: 'Image deleted from Hostinger server storage',
        url: targetUrl
      });
    }

    // B. Image Upload (Base64 dataUrl or binary)
    const image = body.image || body.file;
    if (!image) {
      return res.status(400).json({ status: 'error', message: 'No image data provided' });
    }

    const prefix = (body.prefix || 'img').replace(/[^a-zA-Z0-9_-]/g, '_');
    const oldImage = body.old_image || body.replace_url;

    // Safely delete previous image if replaced
    if (oldImage) {
      try {
        const oldFilename = path.basename(new URL(oldImage, 'http://localhost').pathname);
        if (oldFilename && /^[a-zA-Z0-9_\-\.]+$/.test(oldFilename)) {
          const oldPath = path.join(UPLOADS_DIR, oldFilename);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      } catch {}
    }

    let ext = 'jpg';
    let buffer: Buffer;

    if (typeof image === 'string' && image.startsWith('data:')) {
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1].toLowerCase();
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('svg')) ext = 'svg';
        else if (mime.includes('pdf')) ext = 'pdf';
        else ext = 'jpg';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(image);
      }
    } else {
      buffer = Buffer.from(image);
    }

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(targetPath, buffer);

    const fileUrl = `/uploads/${filename}?v=${Date.now()}`;
    return res.json({
      status: 'success',
      message: 'File successfully uploaded and saved to Hostinger server storage',
      url: fileUrl,
      filename,
      storage: 'hostinger_server_storage'
    });
  });

  // Dedicated endpoint to fetch specific lab's website data directly by ID, slug, phone, or domain
  app.get(['/api/lab/:identifier', '/api/labs/:identifier', '/api/vendor/:identifier'], (req, res) => {
    const rawId = (req.params.identifier || '').toLowerCase().trim();
    const store = readDevDb();
    const vendorLabs: any[] = store.vendor_labs || store.vendorLabs || [];
    const settingsMap = store.lab_settings || store.labSettingsMap || {};
    const tests: any[] = store.lab_tests || store.tests || [];
    const packages: any[] = store.lab_packages || store.packages || [];
    const doctors: any[] = store.lab_doctors || store.doctors || [];
    const branches: any[] = store.vendor_branches || store.branches || [];

    const DEFAULT_VENDOR_LABS = [
      {
        id: 'lab-1020304050',
        name: 'Lab 1 Diagnostic Centre',
        tagline: 'Accurate Diagnostics & Clinical Pathology — Lab 1',
        city: 'Ludhiana',
        state: 'Punjab',
        address: 'SCO 101, Medical Enclave, Civil Road, Ludhiana - 141001',
        phone: '+91 1020304050',
        nablCode: 'MC-1020',
        badge: 'Diagnostic Lab 1',
        status: 'Active',
        isWebsiteApproved: true,
        domainPreview: '1020304050.indianlalaji.com',
        slug: '1020304050',
      },
      {
        id: 'lab-6070809010',
        name: 'Lab 2 Diagnostic Centre',
        tagline: 'Advanced Clinical Pathology & Molecular Testing — Lab 2',
        city: 'Mohali',
        state: 'Punjab',
        address: 'SCO 202, Sector 70, Healthcare Boulevard, Mohali - 160071',
        phone: '+91 6070809010',
        nablCode: 'MC-6070',
        badge: 'Diagnostic Lab 2',
        status: 'Active',
        isWebsiteApproved: true,
        domainPreview: '6070809010.indianlalaji.com',
        slug: '6070809010',
      },
      {
        id: 'lab-apex',
        name: 'Apex Diagnostic & Clinical Pathology Laboratory',
        tagline: 'Advanced Pathology, Biochemistry & Digital Testing Centre',
        city: 'Ludhiana',
        state: 'Punjab',
        address: 'SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana',
        phone: '+91 7087033009',
        nablCode: 'MC-4821',
        badge: 'Central Reference Lab',
        status: 'Active',
        isWebsiteApproved: true,
        domainPreview: 'apexdiagnostics.indianlalaji.com',
        slug: 'apex',
      },
      {
        id: 'lab-citycare',
        name: 'CityCare Advanced Diagnostics & Scan Centre',
        tagline: 'Automated Immunoassay, Biochemistry & Preventive Profiles',
        city: 'Mohali',
        state: 'Punjab',
        address: 'SCO 14, Phase 7, Near Fortis Chowk, Mohali',
        phone: '+91 9815012345',
        nablCode: 'MC-3912 (QCI Certified)',
        badge: 'Enterprise Diagnostic Network',
        status: 'Active',
        isWebsiteApproved: true,
        domainPreview: 'citycare.indianlalaji.com',
        slug: 'citycare',
      },
      {
        id: 'lab-metropath',
        name: 'MetroPath Scans & Molecular Pathology Hub',
        tagline: 'Hormone Assays, Vitamin Profiling & Cancer Tumor Markers',
        city: 'Chandigarh',
        state: 'Chandigarh (UT)',
        address: 'SCO 128-129, Sector 34-A, Healthcare District, Chandigarh',
        phone: '+91 9417098765',
        nablCode: 'MC-5104 (NABL Accredited)',
        badge: 'Super Specialty Lab',
        status: 'Active',
        isWebsiteApproved: true,
        domainPreview: 'metropath.indianlalaji.com',
        slug: 'metropath',
      },
      {
        id: 'lab-sanjivani',
        name: 'Sanjivani Pathology & Diagnostic Laboratory',
        tagline: 'Trusted Diagnostics & Complete Clinical Biochemistry',
        city: 'Amritsar',
        state: 'Punjab',
        address: 'Near Gate 2, District Civil Hospital Road, Amritsar',
        phone: '+91 9888123456',
        nablCode: 'MC-4198',
        badge: 'Regional Diagnostic Center',
        status: 'Active',
        isWebsiteApproved: true,
        domainPreview: 'sanjivani.indianlalaji.com',
        slug: 'sanjivani',
      },
    ];

    const allKnownLabs = [
      ...vendorLabs,
      ...DEFAULT_VENDOR_LABS.filter((d) => !vendorLabs.some((v: any) => v.id === d.id)),
    ];

    const matchedLab = allKnownLabs.find((l: any) => {
      const id = (l.id || '').toLowerCase();
      const slug = (l.slug || '').toLowerCase();
      const dp = (l.domainPreview || '').toLowerCase();
      const phone = (l.phone || '').replace(/\D/g, '');
      const name = (l.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      return (
        id === rawId ||
        id === `lab-${rawId}` ||
        id.replace(/^lab-/, '') === rawId.replace(/^lab-/, '') ||
        slug === rawId ||
        dp.includes(rawId) ||
        dp.split('.')[0] === rawId ||
        (phone.length >= 10 && phone.slice(-10) === rawId.replace(/\D/g, '').slice(-10)) ||
        name.includes(rawId.replace(/[^a-z0-9]/g, ''))
      );
    });

    if (matchedLab) {
      const labId = matchedLab.id;
      const labSettings = settingsMap[labId] || null;
      const labTests = tests.filter((t: any) => !t.labId || t.labId === labId || t.labId === 'all');
      const labPackages = packages.filter((p: any) => !p.labId || p.labId === labId || p.labId === 'all');
      const labDoctors = doctors.filter((d: any) => !d.labId || d.labId === labId || d.labId === 'all');
      const labBranches = branches.filter((b: any) => !b.labId || b.labId === labId || b.labId === 'all');

      return res.json({
        status: 'success',
        found: true,
        lab: matchedLab,
        settings: labSettings,
        tests: labTests,
        packages: labPackages,
        doctors: labDoctors,
        branches: labBranches,
      });
    }

    return res.status(404).json({
      status: 'not_found',
      found: false,
      message: `Laboratory '${rawId}' was not found in directory.`,
    });
  });

  // 2. Fetch all sync data or collection
  app.get(['/api/sync', '/api/sync.php'], (req, res) => {
    const action = req.query.action;
    if (action === 'ping') {
      res.json({
        status: 'success',
        success: true,
        mode: 'express_dev',
        message: 'IndianLalaji Hostinger Backend Emulation Active',
        timestamp: new Date().toISOString(),
        version: '3.5.0-dev'
      });
      return;
    }

    const store = readDevDb();
    const lastUpdatedTime = new Date(store._lastUpdated || Date.now()).getTime();

    if (action === 'check_updates') {
      const since = parseFloat(req.query.since as string) || 0;
      const hasUpdates = lastUpdatedTime > since;
      res.json({
        status: 'success',
        success: true,
        serverTime: Date.now(),
        lastUpdated: lastUpdatedTime,
        hasUpdates,
        updatedCollections: hasUpdates ? Object.keys(store).filter((k) => !k.startsWith('_')) : [],
        storageMode: 'file'
      });
      return;
    }

    // Build unified canonical data with both snake_case and camelCase keys
    const canonicalData: Record<string, any> = {
      reception_entries: store.reception_entries || store.receptionEntries || [],
      lab_reports: store.lab_reports || store.reports || [],
      vendor_bookings: store.vendor_bookings || store.bookings || [],
      lab_staff: store.lab_staff || store.staff || [],
      lab_settings: store.lab_settings || store.labSettingsMap || {},
      lab_tests: store.lab_tests || store.tests || [],
      lab_packages: store.lab_packages || store.packages || [],
      lab_doctors: store.lab_doctors || store.doctors || [],
      vendor_branches: store.vendor_branches || store.branches || [],
      vendor_labs: store.vendor_labs || store.vendorLabs || [],
      company_settings: store.company_settings || store.companySettings || null,
      portal_sections: store.portal_sections || store.portalSections || null,
      seo_settings: store.seo_settings || store.seoSettings || null,
      domain_requests: store.domain_requests || store.domainRequests || [],
      contact_submissions: store.contact_submissions || store.contactSubmissions || [],
      pricing_plans: store.pricing_plans || store.pricingPlans || [],
      plan_requests: store.plan_requests || store.planRequests || [],
      // Also provide camelCase aliases
      receptionEntries: store.reception_entries || store.receptionEntries || [],
      reports: store.lab_reports || store.reports || [],
      bookings: store.vendor_bookings || store.bookings || [],
      staff: store.lab_staff || store.staff || [],
      labSettingsMap: store.lab_settings || store.labSettingsMap || {},
      tests: store.lab_tests || store.tests || [],
      packages: store.lab_packages || store.packages || [],
      doctors: store.lab_doctors || store.doctors || [],
      branches: store.vendor_branches || store.branches || [],
      vendorLabs: store.vendor_labs || store.vendorLabs || [],
      companySettings: store.company_settings || store.companySettings || null,
      portalSections: store.portal_sections || store.portalSections || null,
      seoSettings: store.seo_settings || store.seoSettings || null,
    };

    function normalizeTenantIdServer(id: any): string {
      if (!id || typeof id !== 'string') return '';
      const clean = id.trim().toLowerCase();
      if (clean === 'lab-apex' || clean === 'apexdiagnostics' || clean === 'apex' || clean === 'lsp-7087' || clean === 'lsp_7087') {
        return 'apexdiagnostics';
      }
      return clean;
    }

    function isTenantMatchServer(itemLabId: any, targetLabId: any): boolean {
      if (!targetLabId || targetLabId === 'all') return true;
      const normTarget = normalizeTenantIdServer(targetLabId);
      const normItem = normalizeTenantIdServer(itemLabId);
      if (!normItem) return normTarget === 'apexdiagnostics';
      return normItem === normTarget;
    }

    if (action === 'get_collection') {
      const collection = req.query.collection as string;
      const targetLabId = (req.query.labId || req.query.tenantId) as string;
      let data = canonicalData[collection] || store[collection] || [];
      if (targetLabId && targetLabId !== 'all' && Array.isArray(data)) {
        data = data.filter((item: any) => {
          const itemLabId = item.labId || item.tenantId;
          return isTenantMatchServer(itemLabId, targetLabId);
        });
      }
      res.json({
        status: 'success',
        success: true,
        collection,
        data,
        serverTime: Date.now()
      });
      return;
    }

    res.json({
      status: 'success',
      success: true,
      data: canonicalData,
      serverTime: Date.now(),
      lastUpdated: lastUpdatedTime,
      storageMode: 'file',
      timestamp: new Date().toISOString()
    });
  });

  // 3. Save / Update / Delete entity
  app.post(['/api/sync', '/api/sync.php'], (req, res) => {
    const body = req.body;
    if (!body || !body.collection) {
      res.status(400).json({ status: 'error', success: false, error: 'collection is required' });
      return;
    }

    const { collection, data, action = 'save', id } = body;
    const store = readDevDb();

    // Map alias to primary keys
    const isLabSettings = collection === 'lab_settings' || collection === 'labSettingsMap';
    const isCompanySettings = collection === 'company_settings' || collection === 'companySettings';
    const isPortalSections = collection === 'portal_sections' || collection === 'portalSections';
    const isSeoSettings = collection === 'seo_settings' || collection === 'seoSettings';

    if (isLabSettings) {
      if (!store.lab_settings) store.lab_settings = {};
      if (!store.labSettingsMap) store.labSettingsMap = {};
      if (typeof data === 'object' && data !== null) {
        const labId = id || data.labId || data.id;
        if (labId) {
          store.lab_settings[labId] = { ...(store.lab_settings[labId] || {}), ...data };
          store.labSettingsMap[labId] = { ...(store.labSettingsMap[labId] || {}), ...data };
        } else {
          Object.assign(store.lab_settings, data);
          Object.assign(store.labSettingsMap, data);
        }
      }
    } else if (isCompanySettings) {
      store.company_settings = data;
      store.companySettings = data;
    } else if (isPortalSections) {
      store.portal_sections = data;
      store.portalSections = data;
    } else if (isSeoSettings) {
      store.seo_settings = data;
      store.seoSettings = data;
    } else {
      const key = collection;
      if (!Array.isArray(store[key])) {
        store[key] = [];
      }

      if (action === 'batch_save') {
        const items = body.items || (Array.isArray(data) ? data : []);
        const map = new Map<string, any>();
        for (const it of store[key]) {
          const itId = it.id || it.reportId || it.labId;
          if (itId) map.set(itId, it);
        }
        for (const it of items) {
          const itId = it.id || it.reportId || it.labId;
          if (itId) {
            it._updatedAt = new Date().toISOString();
            const existing = map.get(itId) || {};
            map.set(itId, { ...existing, ...it });
          }
        }
        store[key] = Array.from(map.values());
      } else if (action === 'seed_all') {
        const allCols = body.collections || {};
        for (const [colName, colItems] of Object.entries(allCols)) {
          if (!store[colName] || (Array.isArray(store[colName]) && store[colName].length === 0)) {
            if (Array.isArray(colItems)) {
              store[colName] = colItems;
            }
          }
        }
      } else if (action === 'delete') {
        const targetId = id || data?.id || data?.reportId;
        if (targetId) {
          store[key] = store[key].filter((item: any) => (item.id || item.reportId || item.labId) !== targetId);
        }
      } else {
        const targetId = id || data?.id || data?.reportId;
        if (data && targetId) {
          const idx = store[key].findIndex((item: any) => (item.id || item.reportId || item.labId) === targetId);
          if (idx >= 0) {
            store[key][idx] = { ...store[key][idx], ...data, _updatedAt: new Date().toISOString() };
          } else {
            store[key].unshift({ ...data, _updatedAt: new Date().toISOString() });
          }
        } else if (Array.isArray(data)) {
          store[key] = data;
        } else if (data) {
          store[key].unshift(data);
        }
      }

      if (collection === 'lab_staff' || collection === 'staff') {
        store.lab_staff = store[key];
        store.staff = store[key];
      }
    }

    const saved = writeDevDb(store);
    res.json({
      status: saved ? 'success' : 'error',
      success: saved,
      action,
      collection,
      id,
      serverTime: Date.now(),
      message: saved ? 'Saved to central Hostinger storage' : 'Failed to write data',
      timestamp: new Date().toISOString()
    });
  });

  // 5. Vendor AI Voice Assistant endpoint
  app.post(['/api/ai/voice-chat', '/api/ai/voice-chat.php'], async (req, res) => {
    try {
      const { vendorName, message, vendorContext } = req.body || {};
      if (process.env.GEMINI_API_KEY && message) {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const vLabName = vendorContext?.vendorName || vendorName || 'Diagnostic Lab';
          const systemInstruction = `You are the official, helpful AI Voice Assistant for "${vLabName}".
CRITICAL SECURITY & SCOPE CONSTRAINTS:
1. You represent ONLY "${vLabName}".
2. You must ONLY answer using the provided vendor data below. Do NOT mention, recommend, or access data of any other laboratory or vendor. If asked about other vendors or outside labs, politely state that you only assist with "${vLabName}".
3. Keep responses conversational, clear, friendly, and concise (under 75 words), so they are easy to speak aloud.
4. Support Hindi, English, and Hinglish. Reply in the same language or tone (Hindi/Hinglish/English) as the user asked.
5. Highlight test prices in INR (₹), fasting requirements, turnaround time, home collection details, and lab timings.

VENDOR DATA:
Lab Name: ${vLabName}
Address: ${vendorContext?.address || 'City Centre'}
Phone / Contact: ${vendorContext?.phone || 'Available on website'}
Timings: ${vendorContext?.timings || '07:00 AM - 09:00 PM'}
Home Collection Fee: ${vendorContext?.homeCollectionFee !== undefined ? `₹${vendorContext.homeCollectionFee}` : 'Available'}
Available Tests: ${JSON.stringify(vendorContext?.tests || [])}
Available Health Packages: ${JSON.stringify(vendorContext?.packages || [])}
Consultant Doctors: ${JSON.stringify(vendorContext?.doctors || [])}
`;

          let aiText = '';
          const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
          for (const targetModel of modelsToTry) {
            try {
              const response = await ai.models.generateContent({
                model: targetModel,
                contents: message,
                config: {
                  systemInstruction,
                  temperature: 0.3,
                },
              });
              if (response && response.text) {
                aiText = response.text;
                break;
              }
            } catch (mErr) {
              console.warn(`[Gemini Server API] Model ${targetModel} attempt failed:`, mErr);
            }
          }

          if (aiText) {
            return res.json({
              status: 'success',
              reply: aiText,
              speechText: aiText.replace(/[*#_~]/g, ''),
            });
          }
        } catch (genAiErr) {
          console.warn('[Gemini Server API Warning]:', genAiErr);
        }
      }

      return res.json({
        status: 'success',
        useFallback: true,
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 'error',
        message: err?.message || 'Voice chat processing error',
        useFallback: true,
      });
    }
  });

  // Mount Vite development middlewares
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        // Completely strip /@vite/client so dev server HMR / WebSocket client never executes in browser
        template = template.replace(/<script type="module" src="\/@vite\/client"><\/script>/gi, '');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.use('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hostinger Backend & Frontend Server] Ready at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Error]:', err);
});

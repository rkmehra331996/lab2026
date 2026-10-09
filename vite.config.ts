import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function hostingerApiDevPlugin(): Plugin {
  const dataDir = path.resolve(__dirname, 'public/api/data');
  const uploadsDir = path.resolve(__dirname, 'public/uploads');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

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
      domainPreview: 'indianlalaji.com/shop/1020304050',
      websiteUrl: 'https://indianlalaji.com/shop/1020304050',
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
      domainPreview: 'indianlalaji.com/shop/6070809010',
      websiteUrl: 'https://indianlalaji.com/shop/6070809010',
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
      domainPreview: 'indianlalaji.com/shop/apex',
      websiteUrl: 'https://indianlalaji.com/shop/apex',
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
      domainPreview: 'indianlalaji.com/shop/citycare',
      websiteUrl: 'https://indianlalaji.com/shop/citycare',
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
      domainPreview: 'indianlalaji.com/shop/metropath',
      websiteUrl: 'https://indianlalaji.com/shop/metropath',
      slug: 'metropath',
    },
    {
      id: 'lab-sanjivani',
      name: 'Sanjivani Pathology & Preventive Health Lab',
      tagline: 'Affordable Routine Blood Testing & Free Home Sample Collection',
      city: 'Amritsar',
      state: 'Punjab',
      address: 'Near Gate 2, District Civil Hospital Road, Amritsar',
      phone: '+91 9888123456',
      nablCode: 'ISO 9001:2015 Compliant',
      badge: 'Community Health Partner',
      status: 'Active',
      isWebsiteApproved: true,
      domainPreview: 'indianlalaji.com/shop/sanjivani',
      websiteUrl: 'https://indianlalaji.com/shop/sanjivani',
      slug: 'sanjivani',
    },
  ];

  const readCol = (col: string): any[] => {
    const p = path.join(dataDir, `${col}.json`);
    if (!fs.existsSync(p)) {
      if (col === 'vendor_labs') return DEFAULT_VENDOR_LABS;
      return [];
    }
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (col === 'vendor_labs' && (!Array.isArray(data) || data.length === 0)) {
        return DEFAULT_VENDOR_LABS;
      }
      return data;
    } catch {
      if (col === 'vendor_labs') return DEFAULT_VENDOR_LABS;
      return [];
    }
  };

  const writeCol = (col: string, data: any[]) => {
    const p = path.join(dataDir, `${col}.json`);
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
    const metaPath = path.join(dataDir, '_meta.json');
    fs.writeFileSync(
      metaPath,
      JSON.stringify({ lastUpdated: Date.now(), lastCollection: col }),
      'utf-8'
    );
  };

  const getMeta = (): { lastUpdated: number; lastCollection: string } => {
    const metaPath = path.join(dataDir, '_meta.json');
    if (fs.existsSync(metaPath)) {
      try {
        return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      } catch {}
    }
    return { lastUpdated: Date.now(), lastCollection: '' };
  };

  return {
    name: 'hostinger-api-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlStr = req.url || '';
        const [pathname, searchStr] = urlStr.split('?');
        const searchParams = new URLSearchParams(searchStr || '');

        // 1. API: /api/status.php and /api/status
        if (pathname === '/api/status.php' || pathname === '/api/status') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'online',
              platform: 'INDIANLALAJI.COM',
              server: 'Hostinger (Dev Server)',
              storageMode: 'file',
              timestamp: Date.now(),
            })
          );
          return;
        }

        // 2. API: /api/upload.php and /api/upload
        if ((pathname === '/api/upload.php' || pathname === '/api/upload') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              if (payload.image) {
                const match = payload.image.match(/^data:image\/(\w+);base64,(.+)$/);
                if (match) {
                  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
                  const buffer = Buffer.from(match[2], 'base64');
                  const filename = `${payload.prefix || 'img'}_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 6)}.${ext}`;
                  fs.writeFileSync(path.join(uploadsDir, filename), buffer);

                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      status: 'success',
                      url: `/uploads/${filename}`,
                      filename,
                    })
                  );
                  return;
                }
              }
            } catch {}
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', message: 'Upload parse error' }));
          });
          return;
        }

        // 2b. API: /api/lab/:identifier or /api/labs/:identifier or /api/vendor/:identifier
        const labMatch = pathname.match(/^\/api\/(?:lab|labs|vendor)\/([^/?#]+)/i);
        if (labMatch && req.method === 'GET') {
          const rawId = decodeURIComponent(labMatch[1]).toLowerCase().trim();
          const vendorLabs = readCol('vendor_labs');
          const settingsMap = readCol('lab_settings');
          const tests = readCol('lab_tests');
          const packages = readCol('lab_packages');
          const doctors = readCol('lab_doctors');
          const branches = readCol('vendor_branches');

          const matchedLab = vendorLabs.find((l: any) => {
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

          res.setHeader('Content-Type', 'application/json');
          if (matchedLab) {
            const labId = matchedLab.id;
            const labSettings = Array.isArray(settingsMap)
              ? settingsMap.find((s: any) => s.labId === labId) || null
              : (settingsMap && typeof settingsMap === 'object' ? (settingsMap as any)[labId] : null);

            res.end(
              JSON.stringify({
                status: 'success',
                found: true,
                lab: matchedLab,
                settings: labSettings,
                tests: tests.filter((t: any) => !t.labId || t.labId === labId || t.labId === 'all'),
                packages: packages.filter((p: any) => !p.labId || p.labId === labId || p.labId === 'all'),
                doctors: doctors.filter((d: any) => !d.labId || d.labId === labId || d.labId === 'all'),
                branches: branches.filter((b: any) => !b.labId || b.labId === labId || b.labId === 'all'),
              })
            );
            return;
          }

          res.statusCode = 404;
          res.end(
            JSON.stringify({
              status: 'not_found',
              found: false,
              message: `Laboratory '${rawId}' was not found in directory.`,
            })
          );
          return;
        }

        // 3. API: /api/sync.php and /api/sync (including ping)
        if (
          pathname === '/api/sync.php' ||
          pathname === '/api/sync' ||
          pathname === '/api/sync/ping' ||
          pathname === '/api/ping'
        ) {
          res.setHeader('Content-Type', 'application/json');
          const action = searchParams.get('action') || '';

          if (req.method === 'GET') {
            if (action === 'ping' || pathname === '/api/sync/ping' || pathname === '/api/ping') {
              res.end(
                JSON.stringify({
                  status: 'online',
                  success: true,
                  mode: 'express_dev',
                  message: 'IndianLalaji Hostinger Backend Emulation Active',
                  timestamp: new Date().toISOString(),
                  version: '3.5.0-dev',
                })
              );
              return;
            }

            if (action === 'check_updates') {
              const since = parseFloat(searchParams.get('since') || '0');
              const meta = getMeta();
              res.end(
                JSON.stringify({
                  status: 'success',
                  serverTime: Date.now(),
                  lastUpdated: meta.lastUpdated,
                  hasUpdates: meta.lastUpdated > since,
                  lastCollection: meta.lastCollection,
                  storageMode: 'file',
                })
              );
              return;
            }

            if (action === 'get_collection') {
              const col = searchParams.get('collection') || '';
              const data = readCol(col);
              res.end(
                JSON.stringify({
                  status: 'success',
                  collection: col,
                  data,
                  serverTime: Date.now(),
                })
              );
              return;
            }

            // Get All
            const cols = [
              'reception_entries',
              'lab_reports',
              'vendor_bookings',
              'lab_staff',
              'lab_settings',
              'lab_tests',
              'lab_packages',
              'lab_doctors',
              'vendor_branches',
              'company_settings',
              'portal_sections',
              'vendor_labs',
              'pricing_plans',
              'contact_submissions',
              'domain_requests',
            ];
            const allData: Record<string, any[]> = {};
            for (const c of cols) {
              allData[c] = readCol(c);
            }
            res.end(
              JSON.stringify({
                status: 'success',
                data: allData,
                serverTime: Date.now(),
                lastUpdated: getMeta().lastUpdated,
                storageMode: 'file',
              })
            );
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const payload = JSON.parse(body);
                const postAction = payload.action || 'save';
                const collection = payload.collection || '';

                if (postAction === 'save') {
                  const id = String(payload.id || payload.data?.id || payload.data?.reportId || payload.data?.labId || Date.now());
                  const itemData = payload.data || {};
                  itemData.id = itemData.id || id;
                  itemData._updatedAt = new Date().toISOString();

                  if (collection === 'labSettingsMap' && itemData && typeof itemData === 'object') {
                    const settingsList = readCol('lab_settings');
                    for (const [sLabId, sData] of Object.entries(itemData)) {
                      const idx = settingsList.findIndex((it: any) => it.labId === sLabId || it.id === sLabId);
                      if (idx !== -1) {
                        settingsList[idx] = { ...settingsList[idx], ...(sData as object), labId: sLabId };
                      } else {
                        settingsList.push({ ...(sData as object), labId: sLabId, id: sLabId });
                      }
                    }
                    writeCol('lab_settings', settingsList);
                  } else {
                    const list = readCol(collection);
                    const idx = list.findIndex(
                      (it: any) => (it.id || it.reportId || it.labId) === id
                    );
                    if (idx !== -1) {
                      list[idx] = { ...list[idx], ...itemData };
                    } else {
                      list.unshift(itemData);
                    }
                    writeCol(collection, list);
                  }

                  res.end(
                    JSON.stringify({
                      status: 'success',
                      action: 'save',
                      collection,
                      id,
                      serverTime: Date.now(),
                    })
                  );
                  return;
                }

                if (postAction === 'delete') {
                  const id = String(payload.id || payload.data?.id || payload.data?.reportId || payload.data?.labId || '');
                  const list = readCol(collection);
                  const filtered = list.filter(
                    (it: any) => (it.id || it.reportId || it.labId) !== id
                  );
                  writeCol(collection, filtered);

                  res.end(
                    JSON.stringify({
                      status: 'success',
                      action: 'delete',
                      collection,
                      id,
                      serverTime: Date.now(),
                    })
                  );
                  return;
                }

                if (postAction === 'batch_save') {
                  const items = payload.items || [];
                  const list = readCol(collection);
                  const map = new Map<string, any>();
                  for (const it of list) {
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
                  writeCol(collection, Array.from(map.values()));

                  res.end(
                    JSON.stringify({
                      status: 'success',
                      action: 'batch_save',
                      collection,
                      count: items.length,
                      serverTime: Date.now(),
                    })
                  );
                  return;
                }

                if (postAction === 'seed_all') {
                  const allCols = payload.collections || {};
                  for (const [colName, colItems] of Object.entries(allCols)) {
                    const existing = readCol(colName);
                    if (existing.length === 0 && Array.isArray(colItems)) {
                      writeCol(colName, colItems);
                    }
                  }
                  res.end(
                    JSON.stringify({
                      status: 'success',
                      action: 'seed_all',
                      serverTime: Date.now(),
                    })
                  );
                  return;
                }
              } catch (err: any) {
                res.end(
                  JSON.stringify({ status: 'error', message: err?.message || 'Sync error' })
                );
                return;
              }
              res.end(JSON.stringify({ status: 'error', message: 'Unknown action' }));
            });
            return;
          }
        }

        // 4. API: /api/ai/voice-chat (Vendor AI Voice Assistant)
        if (
          (pathname === '/api/ai/voice-chat' || pathname === '/api/ai/voice-chat.php') &&
          req.method === 'POST'
        ) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const payload = JSON.parse(body || '{}');
              const { vendorName, message, vendorContext } = payload;

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
                      console.warn(`[Gemini Dev API] Model ${targetModel} attempt failed:`, mErr);
                    }
                  }

                  if (aiText) {
                    res.end(
                      JSON.stringify({
                        status: 'success',
                        reply: aiText,
                        speechText: aiText.replace(/[*#_~]/g, ''),
                      })
                    );
                    return;
                  }
                } catch (genAiErr) {
                  console.warn('[Gemini Dev API Warning]:', genAiErr);
                }
              }

              // Fallback to client response
              res.end(
                JSON.stringify({
                  status: 'success',
                  useFallback: true,
                })
              );
            } catch (err: any) {
              res.end(
                JSON.stringify({
                  status: 'error',
                  message: err?.message || 'Voice chat processing error',
                  useFallback: true,
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      hostingerApiDevPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'apple-touch-icon.png',
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'IndianLalaji Lab Software',
          short_name: 'IndianLalaji',
          description:
            'Complete laboratory management software for Indian laboratories. Works offline and online with Hostinger MySQL sync.',
          theme_color: '#123B6D',
          background_color: '#F8FAFC',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          // CRITICAL: Exclude html from precache so index.html is always fetched fresh from the live server
          globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}'],
          // Disable navigateFallback so navigation requests hit the network directly and never serve stale cached HTML
          navigateFallback: null,
          navigateFallbackDenylist: [/^\/api\/.*/, /^\/uploads\/.*/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^\/uploads\/.*\.(png|jpg|jpeg|webp|svg)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'uploaded-assets-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 14,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});


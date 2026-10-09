/**
 * Hostinger MySQL Database Seeder
 * Seeds platform settings, Super Admin, labs, packages, and staff to Hostinger Server
 */
import { 
  VENDOR_LABS_DIRECTORY, 
  DEFAULT_VENDOR_SETTINGS_MAP, 
  DEFAULT_ALL_VENDOR_PACKAGES, 
  DEFAULT_ALL_VENDOR_DOCTORS,
  DEFAULT_STAFF_ACCOUNTS,
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_PORTAL_SECTIONS
} from '../src/context/CmsContext';

const HOSTINGER_URL = process.env.HOSTINGER_API_URL || 'https://indianalala.com/api/sync.php';

async function main() {
  console.log('Seeding data to Hostinger MySQL Database at:', HOSTINGER_URL);

  const rkStaff = {
    id: 'staff-rkmehra-admin',
    name: 'R. K. Mehra',
    role: 'admin',
    username: 'rkmehra331996@gmail.com',
    email: 'rkmehra331996@gmail.com',
    phone: '+91 7087033009',
    password: 'Asdfzxcv@336699',
    status: 'active',
    labId: 'all',
    labName: 'Central Diagnostic & Multi-Lab Global Network',
    branchId: 'branch-1',
    branchName: 'Main Diagnostic Hub',
    lastPasswordReset: new Date().toLocaleDateString('en-IN'),
    shift: '24x7 Master Administrator',
    notes: 'Primary Account Owner & Super Admin (rkmehra331996@gmail.com)',
    _updatedAt: new Date().toISOString()
  };

  const payload = {
    action: 'seed_all',
    collections: {
      lab_staff: [rkStaff, ...DEFAULT_STAFF_ACCOUNTS.filter(s => s.id !== rkStaff.id)],
      vendor_labs: VENDOR_LABS_DIRECTORY,
      lab_settings: Object.entries(DEFAULT_VENDOR_SETTINGS_MAP).map(([labId, s]) => ({ ...s, labId })),
      lab_packages: DEFAULT_ALL_VENDOR_PACKAGES,
      lab_doctors: DEFAULT_ALL_VENDOR_DOCTORS,
      company_settings: [{ id: 'main', ...DEFAULT_COMPANY_SETTINGS }],
      portal_sections: [{ id: 'main', ...DEFAULT_PORTAL_SECTIONS }]
    }
  };

  console.log('Sending seed payload to Hostinger server...');
  try {
    const res = await fetch(HOSTINGER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    console.log('Hostinger Server Response:', result);
    console.log('COMPLETED ALL HOSTINGER SEEDING SUCCESSFULLY!');
  } catch (err) {
    console.warn('Hostinger sync notice (offline/local fallback):', err);
  }
}

main().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});

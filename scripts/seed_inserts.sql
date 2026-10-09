
-- ==============================================================================
-- 19. Initial Seed Data: 6 Certified Diagnostic Laboratories
-- ==============================================================================
INSERT INTO `vendor_labs` (
  `id`, `slug`, `name`, `tagline`, `logoUrl`, `address`, `city`, `state`, `pincode`,
  `phone`, `email`, `rating`, `totalReviews`, `badge`, `accreditation`, `status`,
  `isWebsiteApproved`, `isEmergency`, `ownerName`
) VALUES (
  'lab-1020304050', '1020304050', 'Lab 1 Diagnostic Centre', 'Accurate Diagnostics & Clinical Pathology — Lab 1', NULL,
  'SCO 101, Medical Enclave, Civil Road, Ludhiana - 141001', 'Ludhiana', 'Punjab', NULL, '+91 1020304050',
  'contact@lab1diagnostics.com', 4.8, 195, 'Diagnostic Lab 1',
  'MC-1020', 'Active', 1, 1, 'Dr. Lab 1 Director'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `slug` = VALUES(`slug`);

INSERT INTO `vendor_labs` (
  `id`, `slug`, `name`, `tagline`, `logoUrl`, `address`, `city`, `state`, `pincode`,
  `phone`, `email`, `rating`, `totalReviews`, `badge`, `accreditation`, `status`,
  `isWebsiteApproved`, `isEmergency`, `ownerName`
) VALUES (
  'lab-6070809010', '6070809010', 'Lab 2 Diagnostic Centre', 'Advanced Clinical Pathology & Molecular Testing — Lab 2', NULL,
  'SCO 202, Sector 70, Healthcare Boulevard, Mohali - 160071', 'Mohali', 'Punjab', NULL, '+91 6070809010',
  'contact@lab2diagnostics.com', 4.9, 280, 'Diagnostic Lab 2',
  'MC-6070', 'Active', 1, 1, 'Dr. Lab 2 Director'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `slug` = VALUES(`slug`);

INSERT INTO `vendor_labs` (
  `id`, `slug`, `name`, `tagline`, `logoUrl`, `address`, `city`, `state`, `pincode`,
  `phone`, `email`, `rating`, `totalReviews`, `badge`, `accreditation`, `status`,
  `isWebsiteApproved`, `isEmergency`, `ownerName`
) VALUES (
  'lab-apex', 'apex', 'Apex Diagnostic & Clinical Pathology Laboratory', 'Advanced Pathology, Biochemistry & Digital Testing Centre', NULL,
  'SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana', 'Ludhiana', 'Punjab', NULL, '+91 7087033009',
  'contact@apexdiagnostics.com', 4.9, 428, 'Central Reference Lab',
  'MC-4821', 'Active', 1, 1, 'Dr. Rajesh Sharma'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `slug` = VALUES(`slug`);

INSERT INTO `vendor_labs` (
  `id`, `slug`, `name`, `tagline`, `logoUrl`, `address`, `city`, `state`, `pincode`,
  `phone`, `email`, `rating`, `totalReviews`, `badge`, `accreditation`, `status`,
  `isWebsiteApproved`, `isEmergency`, `ownerName`
) VALUES (
  'lab-citycare', 'citycare', 'CityCare Advanced Diagnostics & Scan Centre', 'Automated Immunoassay, Biochemistry & Preventive Profiles', NULL,
  'SCO 14, Phase 7, Near Fortis Chowk, Mohali', 'Mohali', 'Punjab', NULL, '+91 9815012345',
  'info@citycarediagnostics.com', 4.8, 315, 'Enterprise Diagnostic Network',
  'MC-3912 (QCI Certified)', 'Active', 1, 0, 'Dr. Meenakshi Sundaram'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `slug` = VALUES(`slug`);

INSERT INTO `vendor_labs` (
  `id`, `slug`, `name`, `tagline`, `logoUrl`, `address`, `city`, `state`, `pincode`,
  `phone`, `email`, `rating`, `totalReviews`, `badge`, `accreditation`, `status`,
  `isWebsiteApproved`, `isEmergency`, `ownerName`
) VALUES (
  'lab-metropath', 'metropath', 'MetroPath Scans & Molecular Pathology Hub', 'Hormone Assays, Vitamin Profiling & Cancer Tumor Markers', NULL,
  'SCO 128-129, Sector 34-A, Healthcare District, Chandigarh', 'Chandigarh', 'Chandigarh (UT)', NULL, '+91 9417098765',
  'care@metropathscans.com', 4.9, 580, 'Super Specialty Lab',
  'MC-5104 (NABL Accredited)', 'Active', 1, 1, 'Dr. Arunava Ghosh'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `slug` = VALUES(`slug`);

INSERT INTO `vendor_labs` (
  `id`, `slug`, `name`, `tagline`, `logoUrl`, `address`, `city`, `state`, `pincode`,
  `phone`, `email`, `rating`, `totalReviews`, `badge`, `accreditation`, `status`,
  `isWebsiteApproved`, `isEmergency`, `ownerName`
) VALUES (
  'lab-sanjivani', 'sanjivani', 'Sanjivani Pathology & Preventive Health Lab', 'Affordable Routine Blood Testing & Free Home Sample Collection', NULL,
  'Near Gate 2, District Civil Hospital Road, Amritsar', 'Amritsar', 'Punjab', NULL, '+91 9888123456',
  'sanjivanilab@gmail.com', 4.7, 240, 'Community Health Partner',
  'ISO 9001:2015 Compliant', 'Active', 1, 0, 'Dr. Harbhajan Gill'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `slug` = VALUES(`slug`);

-- 20. Initial Seed Data: Settings & Branding for 6 Laboratories
INSERT INTO `lab_settings` (
  `labId`, `labName`, `tagline`, `logoUrl`, `phone`, `email`, `address`,
  `city`, `state`, `pincode`, `brandColor`, `secondaryColor`, `upiId`,
  `upiMerchantName`, `whatsappNumber`, `supportPhone`, `autoSendWhatsApp`,
  `status`, `isWebsiteApproved`, `settingsJson`
) VALUES (
  'lab-1020304050', 'Lab 1 Diagnostic Centre', 'Accurate Diagnostics & Clinical Pathology — Lab 1', NULL, '+91 1020304050',
  'contact@lab1diagnostics.com', 'SCO 101, Medical Enclave, Civil Road, Ludhiana - 141001', 'Ludhiana', 'Punjab', '141001',
  '#0D9488', '#0F766E', '1020304050@upi',
  'Lab 1 Diagnostic Centre', '+91 1020304050', '+91 1020304050',
  1, 'Active', 1, '{"id":"lab-1020304050","labId":"lab-1020304050","labName":"Lab 1 Diagnostic Centre","tagline":"Accurate Diagnostics & Clinical Pathology — Lab 1","phone":"+91 1020304050","email":"contact@lab1diagnostics.com","address":"SCO 101, Medical Enclave, Civil Road, Ludhiana - 141001","city":"Ludhiana","state":"Punjab","pincode":"141001","brandColor":"#0D9488","secondaryColor":"#0F766E","upiId":"1020304050@upi","upiMerchantName":"Lab 1 Diagnostic Centre","whatsappNumber":"+91 1020304050","supportPhone":"+91 1020304050","status":"Active","isWebsiteApproved":true,"domainPreview":"indianlalaji.com/shop/1020304050","websiteDomain":"","nablCode":"MC-1020","establishedYear":2018,"ownerName":"Dr. Lab 1 Director","workingHours":"8:00 AM - 8:00 PM (Mon-Sat)","heroHeadline":"Lab 1 Diagnostic Centre","heroSubheadline":"Accurate Diagnostics & Clinical Pathology — Lab 1","features":["Instant WhatsApp Reports","Home Sample Pickup","Digital Barcoded Tubes"],"autoSendWhatsApp":true,"enableOnlineBooking":true,"websiteUrl":"https://indianlalaji.com/shop/1020304050"}'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `settingsJson` = VALUES(`settingsJson`);

INSERT INTO `lab_settings` (
  `labId`, `labName`, `tagline`, `logoUrl`, `phone`, `email`, `address`,
  `city`, `state`, `pincode`, `brandColor`, `secondaryColor`, `upiId`,
  `upiMerchantName`, `whatsappNumber`, `supportPhone`, `autoSendWhatsApp`,
  `status`, `isWebsiteApproved`, `settingsJson`
) VALUES (
  'lab-6070809010', 'Lab 2 Diagnostic Centre', 'Advanced Clinical Pathology & Molecular Testing — Lab 2', NULL, '+91 6070809010',
  'contact@lab2diagnostics.com', 'SCO 202, Sector 70, Healthcare Boulevard, Mohali - 160071', 'Mohali', 'Punjab', '141001',
  '#2563EB', '#0F766E', '6070809010@upi',
  'Lab 2 Diagnostic Centre', '+91 6070809010', '+91 6070809010',
  1, 'Active', 1, '{"id":"lab-6070809010","labId":"lab-6070809010","labName":"Lab 2 Diagnostic Centre","tagline":"Advanced Clinical Pathology & Molecular Testing — Lab 2","phone":"+91 6070809010","email":"contact@lab2diagnostics.com","address":"SCO 202, Sector 70, Healthcare Boulevard, Mohali - 160071","city":"Mohali","state":"Punjab","pincode":"141001","brandColor":"#2563EB","secondaryColor":"#0F766E","upiId":"6070809010@upi","upiMerchantName":"Lab 2 Diagnostic Centre","whatsappNumber":"+91 6070809010","supportPhone":"+91 6070809010","status":"Active","isWebsiteApproved":true,"domainPreview":"indianlalaji.com/shop/6070809010","websiteDomain":"","nablCode":"MC-6070","establishedYear":2015,"ownerName":"Dr. Lab 2 Director","workingHours":"8:00 AM - 8:00 PM (Mon-Sat)","heroHeadline":"Lab 2 Diagnostic Centre","heroSubheadline":"Advanced Clinical Pathology & Molecular Testing — Lab 2","features":["Automated Biochemistry","Same-Day Fast Track Reports","Online QR Report Verification"],"autoSendWhatsApp":true,"enableOnlineBooking":true,"websiteUrl":"https://indianlalaji.com/shop/6070809010"}'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `settingsJson` = VALUES(`settingsJson`);

INSERT INTO `lab_settings` (
  `labId`, `labName`, `tagline`, `logoUrl`, `phone`, `email`, `address`,
  `city`, `state`, `pincode`, `brandColor`, `secondaryColor`, `upiId`,
  `upiMerchantName`, `whatsappNumber`, `supportPhone`, `autoSendWhatsApp`,
  `status`, `isWebsiteApproved`, `settingsJson`
) VALUES (
  'lab-apex', 'Apex Diagnostic & Clinical Pathology Laboratory', 'Advanced Pathology, Biochemistry & Digital Testing Centre', NULL, '+91 7087033009',
  'contact@apexdiagnostics.com', 'SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana', 'Ludhiana', 'Punjab', '141001',
  '#123B6D', '#0F766E', '7087033009@upi',
  'Apex Diagnostic & Clinical Pathology Laboratory', '+91 7087033009', '+91 7087033009',
  1, 'Active', 1, '{"id":"lab-apex","labId":"lab-apex","labName":"Apex Diagnostic & Clinical Pathology Laboratory","tagline":"Advanced Pathology, Biochemistry & Digital Testing Centre","phone":"+91 7087033009","email":"contact@apexdiagnostics.com","address":"SCF 42-43, Sector 18-C, Central Healthcare Complex, Ludhiana","city":"Ludhiana","state":"Punjab","pincode":"141001","brandColor":"#123B6D","secondaryColor":"#0F766E","upiId":"7087033009@upi","upiMerchantName":"Apex Diagnostic & Clinical Pathology Laboratory","whatsappNumber":"+91 7087033009","supportPhone":"+91 7087033009","status":"Active","isWebsiteApproved":true,"domainPreview":"indianlalaji.com/shop/apex","websiteDomain":"","nablCode":"MC-4821","establishedYear":2012,"ownerName":"Dr. Rajesh Sharma","workingHours":"8:00 AM - 8:00 PM (Mon-Sat)","heroHeadline":"Apex Diagnostic & Clinical Pathology Laboratory","heroSubheadline":"Advanced Pathology, Biochemistry & Digital Testing Centre","features":["Free Home Sample Pickup","Automated WhatsApp PDF","UPI Dynamic QR","Barcoded Tubes"],"autoSendWhatsApp":true,"enableOnlineBooking":true,"websiteUrl":"https://indianlalaji.com/shop/apex"}'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `settingsJson` = VALUES(`settingsJson`);

INSERT INTO `lab_settings` (
  `labId`, `labName`, `tagline`, `logoUrl`, `phone`, `email`, `address`,
  `city`, `state`, `pincode`, `brandColor`, `secondaryColor`, `upiId`,
  `upiMerchantName`, `whatsappNumber`, `supportPhone`, `autoSendWhatsApp`,
  `status`, `isWebsiteApproved`, `settingsJson`
) VALUES (
  'lab-citycare', 'CityCare Advanced Diagnostics & Scan Centre', 'Automated Immunoassay, Biochemistry & Preventive Profiles', NULL, '+91 9815012345',
  'info@citycarediagnostics.com', 'SCO 14, Phase 7, Near Fortis Chowk, Mohali', 'Mohali', 'Punjab', '141001',
  '#0F766E', '#0F766E', '9815012345@upi',
  'CityCare Advanced Diagnostics & Scan Centre', '+91 9815012345', '+91 9815012345',
  1, 'Active', 1, '{"id":"lab-citycare","labId":"lab-citycare","labName":"CityCare Advanced Diagnostics & Scan Centre","tagline":"Automated Immunoassay, Biochemistry & Preventive Profiles","phone":"+91 9815012345","email":"info@citycarediagnostics.com","address":"SCO 14, Phase 7, Near Fortis Chowk, Mohali","city":"Mohali","state":"Punjab","pincode":"141001","brandColor":"#0F766E","secondaryColor":"#0F766E","upiId":"9815012345@upi","upiMerchantName":"CityCare Advanced Diagnostics & Scan Centre","whatsappNumber":"+91 9815012345","supportPhone":"+91 9815012345","status":"Active","isWebsiteApproved":true,"domainPreview":"indianlalaji.com/shop/citycare","websiteDomain":"","nablCode":"MC-3912 (QCI Certified)","establishedYear":2016,"ownerName":"Dr. Meenakshi Sundaram","workingHours":"8:00 AM - 8:00 PM (Mon-Sat)","heroHeadline":"CityCare Advanced Diagnostics & Scan Centre","heroSubheadline":"Automated Immunoassay, Biochemistry & Preventive Profiles","features":["3 Collection Desks","Emergency Stat Testing","Same-Day Hormones","Online Portal"],"autoSendWhatsApp":true,"enableOnlineBooking":true,"websiteUrl":"https://indianlalaji.com/shop/citycare"}'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `settingsJson` = VALUES(`settingsJson`);

INSERT INTO `lab_settings` (
  `labId`, `labName`, `tagline`, `logoUrl`, `phone`, `email`, `address`,
  `city`, `state`, `pincode`, `brandColor`, `secondaryColor`, `upiId`,
  `upiMerchantName`, `whatsappNumber`, `supportPhone`, `autoSendWhatsApp`,
  `status`, `isWebsiteApproved`, `settingsJson`
) VALUES (
  'lab-metropath', 'MetroPath Scans & Molecular Pathology Hub', 'Hormone Assays, Vitamin Profiling & Cancer Tumor Markers', NULL, '+91 9417098765',
  'care@metropathscans.com', 'SCO 128-129, Sector 34-A, Healthcare District, Chandigarh', 'Chandigarh', 'Chandigarh (UT)', '141001',
  '#4338CA', '#0F766E', '9417098765@upi',
  'MetroPath Scans & Molecular Pathology Hub', '+91 9417098765', '+91 9417098765',
  1, 'Active', 1, '{"id":"lab-metropath","labId":"lab-metropath","labName":"MetroPath Scans & Molecular Pathology Hub","tagline":"Hormone Assays, Vitamin Profiling & Cancer Tumor Markers","phone":"+91 9417098765","email":"care@metropathscans.com","address":"SCO 128-129, Sector 34-A, Healthcare District, Chandigarh","city":"Chandigarh","state":"Chandigarh (UT)","pincode":"141001","brandColor":"#4338CA","secondaryColor":"#0F766E","upiId":"9417098765@upi","upiMerchantName":"MetroPath Scans & Molecular Pathology Hub","whatsappNumber":"+91 9417098765","supportPhone":"+91 9417098765","status":"Active","isWebsiteApproved":true,"domainPreview":"indianlalaji.com/shop/metropath","websiteDomain":"","nablCode":"MC-5104 (NABL Accredited)","establishedYear":2010,"ownerName":"Dr. Arunava Ghosh","workingHours":"8:00 AM - 8:00 PM (Mon-Sat)","heroHeadline":"MetroPath Scans & Molecular Pathology Hub","heroSubheadline":"Hormone Assays, Vitamin Profiling & Cancer Tumor Markers","features":["24x7 Emergency Desk","Bioplex Immunoassay","Doctor Consult Desk","Digital QR Reports"],"autoSendWhatsApp":true,"enableOnlineBooking":true,"websiteUrl":"https://indianlalaji.com/shop/metropath"}'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `settingsJson` = VALUES(`settingsJson`);

INSERT INTO `lab_settings` (
  `labId`, `labName`, `tagline`, `logoUrl`, `phone`, `email`, `address`,
  `city`, `state`, `pincode`, `brandColor`, `secondaryColor`, `upiId`,
  `upiMerchantName`, `whatsappNumber`, `supportPhone`, `autoSendWhatsApp`,
  `status`, `isWebsiteApproved`, `settingsJson`
) VALUES (
  'lab-sanjivani', 'Sanjivani Pathology & Preventive Health Lab', 'Affordable Routine Blood Testing & Free Home Sample Collection', NULL, '+91 9888123456',
  'sanjivanilab@gmail.com', 'Near Gate 2, District Civil Hospital Road, Amritsar', 'Amritsar', 'Punjab', '141001',
  '#D97706', '#0F766E', '9888123456@upi',
  'Sanjivani Pathology & Preventive Health Lab', '+91 9888123456', '+91 9888123456',
  1, 'Active', 1, '{"id":"lab-sanjivani","labId":"lab-sanjivani","labName":"Sanjivani Pathology & Preventive Health Lab","tagline":"Affordable Routine Blood Testing & Free Home Sample Collection","phone":"+91 9888123456","email":"sanjivanilab@gmail.com","address":"Near Gate 2, District Civil Hospital Road, Amritsar","city":"Amritsar","state":"Punjab","pincode":"141001","brandColor":"#D97706","secondaryColor":"#0F766E","upiId":"9888123456@upi","upiMerchantName":"Sanjivani Pathology & Preventive Health Lab","whatsappNumber":"+91 9888123456","supportPhone":"+91 9888123456","status":"Active","isWebsiteApproved":true,"domainPreview":"indianlalaji.com/shop/sanjivani","websiteDomain":"","nablCode":"ISO 9001:2015 Compliant","establishedYear":2018,"ownerName":"Dr. Harbhajan Gill","workingHours":"8:00 AM - 8:00 PM (Mon-Sat)","heroHeadline":"Sanjivani Pathology & Preventive Health Lab","heroSubheadline":"Affordable Routine Blood Testing & Free Home Sample Collection","features":["Affordable Fever Panels","Doorstep Phlebotomy","Instant SMS Alerts","Senior Citizen Discount"],"autoSendWhatsApp":true,"enableOnlineBooking":true,"websiteUrl":"https://indianlalaji.com/shop/sanjivani"}'
) ON DUPLICATE KEY UPDATE `status` = 'Active', `isWebsiteApproved` = 1, `settingsJson` = VALUES(`settingsJson`);

-- 21. Initial SaaS Subscription Pricing Plans
INSERT INTO `pricing_plans` (`id`, `name`, `badge`, `priceINR`, `originalPriceINR`, `monthlyPriceINR`, `duration`, `billingInterval`, `isPopular`, `features`)
VALUES
  ('plan-1month', 'Single Laboratory (1 Month)', 'Most Popular', 1499.00, 2499.00, 1499.00, '1 Month', 'monthly', 1, '["1 Diagnostic Center", "Single Desktop & Offline POS", "Unlimited Patients & WhatsApp PDF", "UPI Dynamic QR Payments", "NABL ISO Reports"]'),
  ('plan-3months', 'Professional Diagnostic (3 Months)', 'Best Value', 3999.00, 6999.00, 1333.00, '3 Months', 'quarterly', 0, '["Up to 2 Collection Desks", "Offline Mode with Auto Cloud Sync", "Dual Pathologist Digital Signatures", "Automated WhatsApp Notifications", "GST Compliant Invoicing"]'),
  ('plan-1year', 'Enterprise Diagnostic Network (1 Year)', 'Max Savings', 11999.00, 19999.00, 999.00, '1 Year', 'yearly', 0, '["Unlimited Desks & Collection Hubs", "Custom Brand Domain/Subdomain Support", "Dedicated 24x7 Account Manager", "Custom Test Catalog Setup", "Annual Cloud Archive Storage"]')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `priceINR` = VALUES(`priceINR`);

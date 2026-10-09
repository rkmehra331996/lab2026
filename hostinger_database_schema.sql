-- ==============================================================================
-- INDIANALALA.COM - COMPLETE HOSTINGER MYSQL DATABASE SCHEMA
-- Main Domain: indianalala.com | Hostinger Web Hosting & MySQL Databases
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Table: vendor_labs (All Diagnostic Labs & Centers)
CREATE TABLE IF NOT EXISTS `vendor_labs` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `tagline` VARCHAR(255) DEFAULT NULL,
  `logoUrl` TEXT DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `rating` DECIMAL(3, 1) DEFAULT 4.9,
  `totalReviews` INT DEFAULT 100,
  `badge` VARCHAR(100) DEFAULT 'Verified Lab',
  `accreditation` VARCHAR(100) DEFAULT 'NABL ISO 15189',
  `status` ENUM('Active', 'Draft', 'Suspended') DEFAULT 'Active',
  `isWebsiteApproved` TINYINT(1) DEFAULT 1,
  `isEmergency` TINYINT(1) DEFAULT 1,
  `approvedAt` VARCHAR(50) DEFAULT NULL,
  `approvedBy` VARCHAR(100) DEFAULT NULL,
  `ownerName` VARCHAR(150) DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_slug` (`slug`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: lab_settings (Settings, Theme, UPI, WhatsApp per Lab)
CREATE TABLE IF NOT EXISTS `lab_settings` (
  `labId` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labName` VARCHAR(255) NOT NULL,
  `tagline` VARCHAR(255) DEFAULT NULL,
  `logoUrl` TEXT DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `brandColor` VARCHAR(50) DEFAULT '#123B6D',
  `secondaryColor` VARCHAR(50) DEFAULT '#0F766E',
  `upiId` VARCHAR(100) DEFAULT NULL,
  `upiMerchantName` VARCHAR(150) DEFAULT NULL,
  `whatsappNumber` VARCHAR(50) DEFAULT NULL,
  `supportPhone` VARCHAR(50) DEFAULT NULL,
  `autoSendWhatsApp` TINYINT(1) DEFAULT 1,
  `status` ENUM('Active', 'Draft', 'Suspended') DEFAULT 'Active',
  `isWebsiteApproved` TINYINT(1) DEFAULT 1,
  `settingsJson` LONGTEXT DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: lab_branches (Branches, Collection Centers, Counter Desks)
CREATE TABLE IF NOT EXISTS `lab_branches` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `badge` VARCHAR(100) DEFAULT 'Main Hub',
  `type` VARCHAR(100) DEFAULT 'Diagnostic Hub',
  `address` TEXT DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `timings` VARCHAR(100) DEFAULT '7:00 AM - 9:00 PM',
  `isEmergency` TINYINT(1) DEFAULT 1,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_lab_branch` (`labId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: lab_staff (Staff, Operators, Technicians, Super Admins)
CREATE TABLE IF NOT EXISTS `lab_staff` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) NOT NULL,
  `labName` VARCHAR(255) DEFAULT NULL,
  `branchId` VARCHAR(100) DEFAULT NULL,
  `branchName` VARCHAR(255) DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'suspended') DEFAULT 'active',
  `shift` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `lastPasswordReset` VARCHAR(50) DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_staff_username` (`username`),
  INDEX `idx_staff_lab` (`labId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: lab_tests (500+ NABL Test Catalog)
CREATE TABLE IF NOT EXISTS `lab_tests` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'General',
  `sampleType` VARCHAR(100) DEFAULT NULL,
  `unit` VARCHAR(50) DEFAULT NULL,
  `normalRange` VARCHAR(150) DEFAULT NULL,
  `priceINR` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `tatHours` INT DEFAULT 4,
  `turnaroundTime` VARCHAR(50) DEFAULT '4 Hours',
  `description` TEXT DEFAULT NULL,
  `isPopular` TINYINT(1) DEFAULT 0,
  `status` ENUM('Active', 'Draft', 'Inactive') DEFAULT 'Active',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tests_lab` (`labId`),
  INDEX `idx_tests_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table: lab_packages (Health Checkup Profiles & Bundles)
CREATE TABLE IF NOT EXISTS `lab_packages` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `originalPrice` DECIMAL(10, 2) DEFAULT NULL,
  `testCount` INT DEFAULT 0,
  `tag` VARCHAR(100) DEFAULT 'Popular',
  `description` TEXT DEFAULT NULL,
  `testsIncluded` JSON DEFAULT NULL,
  `isPopular` TINYINT(1) DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_pkg_lab` (`labId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table: lab_doctors (Consultants & Pathologists)
CREATE TABLE IF NOT EXISTS `lab_doctors` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `degree` VARCHAR(150) DEFAULT NULL,
  `specialty` VARCHAR(150) DEFAULT NULL,
  `regNo` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `signatureUrl` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_doc_lab` (`labId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table: lab_reception_entries (Front-Desk Patient Queue & Token Billing)
CREATE TABLE IF NOT EXISTS `lab_reception_entries` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) NOT NULL,
  `branchId` VARCHAR(100) DEFAULT NULL,
  `tokenNumber` VARCHAR(50) NOT NULL,
  `uhid` VARCHAR(50) NOT NULL,
  `barcode` VARCHAR(50) DEFAULT NULL,
  `patientName` VARCHAR(150) NOT NULL,
  `patientAge` INT DEFAULT NULL,
  `patientGender` VARCHAR(20) DEFAULT NULL,
  `patientMobile` VARCHAR(50) NOT NULL,
  `patientEmail` VARCHAR(150) DEFAULT NULL,
  `patientAddress` TEXT DEFAULT NULL,
  `referredBy` VARCHAR(150) DEFAULT 'Self Walk-In',
  `selectedTests` JSON NOT NULL,
  `totalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `dueAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `paymentMethod` VARCHAR(50) DEFAULT 'Cash',
  `paymentStatus` VARCHAR(50) DEFAULT 'Full Payment',
  `status` VARCHAR(50) DEFAULT 'Registered',
  `registeredAt` VARCHAR(50) DEFAULT NULL,
  `sampleCollectedAt` VARCHAR(50) DEFAULT NULL,
  `resultsEnteredAt` VARCHAR(50) DEFAULT NULL,
  `signedAt` VARCHAR(50) DEFAULT NULL,
  `deliveredAt` VARCHAR(50) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `data` LONGTEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_entry_lab` (`labId`),
  INDEX `idx_entry_mobile` (`patientMobile`),
  INDEX `idx_entry_uhid` (`uhid`),
  INDEX `idx_entry_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Table: lab_reports (Diagnostic Test Reports & Results)
CREATE TABLE IF NOT EXISTS `lab_reports` (
  `reportId` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) NOT NULL,
  `branchId` VARCHAR(100) DEFAULT NULL,
  `receptionId` VARCHAR(100) DEFAULT NULL,
  `tokenNumber` VARCHAR(50) DEFAULT NULL,
  `uhid` VARCHAR(50) NOT NULL,
  `patientName` VARCHAR(150) NOT NULL,
  `patientAge` INT DEFAULT NULL,
  `patientGender` VARCHAR(20) DEFAULT NULL,
  `patientMobile` VARCHAR(50) NOT NULL,
  `referredBy` VARCHAR(150) DEFAULT 'Self Walk-In',
  `testName` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Hematology',
  `status` VARCHAR(50) DEFAULT 'Approved',
  `collectedDate` VARCHAR(50) DEFAULT NULL,
  `reportedDate` VARCHAR(50) DEFAULT NULL,
  `sampleType` VARCHAR(100) DEFAULT NULL,
  `parameters` JSON DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `data` LONGTEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_report_lab` (`labId`),
  INDEX `idx_report_mobile` (`patientMobile`),
  INDEX `idx_report_uhid` (`uhid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Table: lab_bookings (Home Collection Bookings)
CREATE TABLE IF NOT EXISTS `lab_bookings` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) NOT NULL,
  `patientName` VARCHAR(150) NOT NULL,
  `patientMobile` VARCHAR(50) NOT NULL,
  `patientEmail` VARCHAR(150) DEFAULT NULL,
  `address` TEXT NOT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `testPackageName` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `preferredDate` VARCHAR(50) DEFAULT NULL,
  `preferredSlot` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_booking_lab` (`labId`),
  INDEX `idx_booking_mobile` (`patientMobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Table: company_settings (Global SaaS Portal Settings)
CREATE TABLE IF NOT EXISTS `company_settings` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `brandName` VARCHAR(255) DEFAULT 'INDIAN LALAJI',
  `tagline` VARCHAR(255) DEFAULT NULL,
  `supportEmail` VARCHAR(150) DEFAULT NULL,
  `supportPhone` VARCHAR(50) DEFAULT NULL,
  `data` LONGTEXT DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Table: portal_sections (Hero, Features, Pricing visibility)
CREATE TABLE IF NOT EXISTS `portal_sections` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `sectionsJson` LONGTEXT DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Table: pricing_plans (SaaS Subscription Plans)
CREATE TABLE IF NOT EXISTS `pricing_plans` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `priceINR` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `durationMonths` INT DEFAULT 1,
  `features` JSON DEFAULT NULL,
  `badge` VARCHAR(100) DEFAULT NULL,
  `data` LONGTEXT DEFAULT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Table: contact_submissions (Inquiries & Lead Captures)
CREATE TABLE IF NOT EXISTS `contact_submissions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) DEFAULT 'all',
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `subject` VARCHAR(255) DEFAULT NULL,
  `message` TEXT DEFAULT NULL,
  `status` ENUM('New', 'Read', 'Contacted', 'Resolved') DEFAULT 'New',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_contact_lab` (`labId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Table: domain_requests (Custom Domain Setup Requests)
CREATE TABLE IF NOT EXISTS `domain_requests` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) NOT NULL,
  `labName` VARCHAR(255) NOT NULL,
  `requestedDomain` VARCHAR(255) NOT NULL,
  `cnameStatus` ENUM('Pending', 'Verified', 'Active', 'Rejected') DEFAULT 'Pending',
  `sslStatus` ENUM('Pending', 'Active', 'Error') DEFAULT 'Pending',
  `data` LONGTEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_domain_lab` (`labId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Table: lab_images (Centralized Image Management: DP, Logo, Banner, QR, Signatures)
CREATE TABLE IF NOT EXISTS `lab_images` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) NOT NULL,
  `imageType` ENUM('logo', 'dp', 'banner', 'qr', 'signature', 'attachment', 'other') NOT NULL,
  `filePath` VARCHAR(255) NOT NULL,
  `originalName` VARCHAR(255) DEFAULT NULL,
  `fileSize` INT DEFAULT 0,
  `mimeType` VARCHAR(100) DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_img_lab` (`labId`),
  INDEX `idx_img_type` (`imageType`),
  INDEX `idx_img_path` (`filePath`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Table: lab_plan_requests (Plan & Renew Requests Queue)
CREATE TABLE IF NOT EXISTS `lab_plan_requests` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `labId` VARCHAR(100) NOT NULL,
  `labName` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `currentPlan` VARCHAR(100) DEFAULT NULL,
  `currentExpiryDate` VARCHAR(50) DEFAULT NULL,
  `requestedPlan` VARCHAR(100) NOT NULL,
  `requestedDurationDays` INT NOT NULL DEFAULT 30,
  `amountINR` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `paymentMode` VARCHAR(50) DEFAULT 'UPI',
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  `resolvedAt` VARCHAR(50) DEFAULT NULL,
  `resolvedBy` VARCHAR(100) DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_plan_lab` (`labId`),
  INDEX `idx_plan_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Initial Super Admin Insert
INSERT INTO `lab_staff` (`id`, `labId`, `labName`, `branchId`, `branchName`, `name`, `role`, `username`, `email`, `phone`, `password`, `status`, `shift`, `notes`)
VALUES (
  'staff-rkmehra-admin',
  'all',
  'Central Diagnostic & Multi-Lab Global Network',
  'branch-1',
  'Main Diagnostic Hub',
  'R. K. Mehra',
  'admin',
  'rkmehra331996@gmail.com',
  'rkmehra331996@gmail.com',
  '+91 7087033009',
  'Asdfzxcv@336699',
  'active',
  '24x7 Master Administrator',
  'Primary Account Owner & Super Admin (rkmehra331996@gmail.com)'
)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `password` = VALUES(`password`);

SET FOREIGN_KEY_CHECKS = 1;

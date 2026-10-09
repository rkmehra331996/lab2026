# INDIANLALAJI.COM - Hostinger Server & Database Setup Guide
**100% Hostinger Native - Zero Firebase Dependency**

---

## 🚀 Overview (ओवरव्यू)
आपका सॉफ़्टवेयर अब **पूरी तरह से Hostinger Server और Database (Single Source of Truth)** से कनेक्ट है। इसमें Firebase का कोई इस्तेमाल नहीं हो रहा है।

जो भी बदलाव (Images, DP, Logo, Banner, Text, Add, Edit, Delete, Update, Lab Settings, Products/Packages, Tests, Reception Token, Reports) होंगे:
1. **Hostinger MySQL Database (Primary Source of Truth):** सारा डेटा सीधे Hostinger MySQL डेटाबेस में सुरक्षित सेव होता है। साथ ही instant JSON file backup इंजन भी एक्टिव रहता है।
2. **Centralized Image Management:**
   - सभी DP, Logo, Banner, QR Codes और डिजिटल सिग्नेचर सीधे Hostinger Server के `/uploads/` फ़ोल्डर में सेव होते हैं।
   - डेटाबेस में केवल फ़ाइल पाथ/रेफ़रेंस (उदा. `/uploads/img_1234.jpg?v=1790400000`) सेव होता है।
   - **Image Replacement:** जब कोई पुरानी इमेज को रिप्लेस करता है, तो पुरानी फ़ाइल Hostinger सर्वर से तुरंत डिलीट हो जाती है और नया रेफ़रेंस अपडेट हो जाता है।
   - **Image Deletion:** जब कोई इमेज डिलीट करता है, तो सर्वर डिस्क से फ़ाइल और डेटाबेस से रेफ़रेंस दोनों डिलीट हो जाते हैं।
   - **Anti-Cache Versioning:** हर इमेज और API रिस्पॉन्स में cache-busting versioning और `no-cache, must-revalidate` हेडर लगे हैं जिससे किसी भी ब्राउज़र में कभी पुरानी इमेज या डेटा नहीं दिखेगा।
3. **New Lab Creation & 100% Data Isolation:**
   - जब भी सुपर एडमिन या वेंडर नई लैब बनाता है, उसका यूनीक लैब आईडी (उदा. `lab-1729482939-abcde`) ऑटो-जनरेट होता है।
   - हर लैब का डेटा पूरी तरह आइसोलेटेड रहता है। किसी नई लैब में किसी पुरानी या डेमो लैब का लोगो, डीपी, टीम फ़ोटो या डेटा लोड नहीं होता।
4. **Auto Multi-Device Real-Time Sync:**
   - हर 1.5 सेकंड में बैकग्राउंड हार्टबीट ऑटो-सिंक एक्टिव रहता है।
   - जैसे ही रिसेप्शन काउंटर पर नया टोकन जनरेट होगा, टेक्नीशियन और पैथोलॉजिस्ट डेस्क पर बिना पेज रीलोड किए तुरंत लाइव अपडेट रिफ्लेक्ट हो जाता है।

---

## 📁 Dist Folder Contents (Hostinger `public_html` में अपलोड के लिए)
जब आप `dist` फ़ोल्डर को Hostinger के File Manager में `public_html` के अंदर अपलोड करेंगे:
- `index.html` → मुख्य React SPA ऐप
- `assets/` → सभी CSS, JS और ऑप्टिमाइज़्ड कोड बंडल्स
- `api/` → Hostinger PHP Backend Engine:
  - `config.php` → डेटाबेस क्रेडेंशियल्स और PDO कनेक्शन
  - `sync.php` → MySQL CRUD व रियल-टाइम मल्टी-डिवाइस डेटा सिंक इंजन
  - `upload.php` → इमेज व DP अपलोड, रिप्लेसमेंट व डिलीट हैंडलर
  - `status.php` → सर्वर हेल्थ व स्टेटस चेक
- `uploads/` → अपलोड की गई सभी इमेजेस का सुरक्षित फ़ोल्डर
- `.htaccess` → Apache / LiteSpeed रूटिंग, स्पीड व नो-कैश ऑप्टिमाइज़ेशन

---

## 🗄️ Database Setup on Hostinger MySQL (2 मिनट में सेटअप)

1. **Hostinger hPanel** में जाएं → **Databases** → **MySQL Databases** पर क्लिक करें।
2. एक नया Database और User बनाएं:
   - Database Name: `u873216892_healthcare` (या आपकी पसंद का नाम)
   - Username: `u873216892_lalaji`
   - Password: अपना सुरक्षित पासवर्ड दर्ज करें
3. **phpMyAdmin** खोलें और रूट में मौजूद `hostinger_database_schema.sql` फ़ाइल को **Import** करें।
   - इसमें सभी 17 टेबल्स (vendor_labs, lab_settings, lab_branches, lab_staff, lab_tests, lab_packages, lab_doctors, lab_reception_entries, lab_reports, lab_bookings, company_settings, portal_sections, pricing_plans, contact_submissions, domain_requests, lab_images, lab_plan_requests) ऑटोमैटिक बन जाएंगी।
4. `api/config.php` फ़ाइल में अपने क्रेडेंशियल्स कन्फ़र्म करें:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'your_mysql_username');
   define('DB_PASS', 'your_mysql_password');
   define('DB_NAME', 'your_mysql_database_name');
   ```

---

## ⚡ Multi-Device Real-Time Sync कैसे काम करता है?
1. जब रिसेप्शनिस्ट काउंटर पर पेशेंट का टोकन जनरेट करता है:
   - डेटा तुरंत Hostinger MySQL (`/api/sync.php`) पर सेव होता है।
2. लैब में बैठे टेक्नीशियन और पैथोलॉजिस्ट का कंप्यूटर हर 1.5 सेकंड में सर्वर से नया डेटा ऑटोमैटिक पुल कर लेता है।
3. किसी भी डिवाइस पर पेज रिफ्रेश (F5) करने की ज़रूरत नहीं है, सब कुछ लाइव अपडेट होता है।
4. पूरे नेटवर्क में सिंगल सोर्स ऑफ़ ट्रुथ (Hostinger MySQL + Server Storage) ही इस्तेमाल होता है।

# 🚀 How to Run Locally & Host on Hostinger (डाउनलोड करने के बाद कैसे चलाएं)

आपकी फ़ाइलों में **कोई भी फ़ीचर या डिज़ाइन चेंज नहीं हुआ है**। यह एक मॉडर्न **React + TypeScript + Tailwind** वेब ऐप है। जब आप इसे कंप्यूटर पर डाउनलोड करते हैं, तो इसे सही तरीके से चलाने के 2 रास्ते हैं:

---

## ⚠️ सबसे जरूरी बात (Important):
> ❌ **`index.html` पर डबल-क्लिक करके सीधे ब्राउज़र में न खोलें!**
> मॉडर्न रिएक्ट (Vite) ऐप्स `file:///` पाथ पर नहीं चलते, क्योंकि ब्राउज़र सुरक्षा कारणों (CORS) से जावास्क्रिप्ट मॉड्यूल्स को ब्लॉक कर देता है। इसलिए पेज ख़ाली या डिज़ाइन बिगड़ा हुआ दिखता है।

---

## 📌 तरीका 1: अपने कंप्यूटर (Laptop / PC) पर लोकल चलाना

यदि आप डाउनलोड किए गए सोर्स कोड को अपने कंप्यूटर पर टेस्ट करना चाहते हैं:

1. कंप्यूटर में **Node.js** (v18 या नया) इंस्टॉल होना चाहिए।
2. डाउनलोड किए गए फ़ोल्डर में टर्मिनल / Command Prompt खोलें और चलाएँ:
   ```bash
   npm install
   npm run dev
   ```
3. आपके ब्राउज़र में `http://localhost:3000` खुलेगा और आपको बिल्कुल वही डिज़ाइन और सभी फ़ीचर्स दिखेंगे जो यहाँ दिख रहे हैं!

---

## 📌 तरीका 2: Hostinger पर लाइव करना (100% Ready)

Hostinger पर चलाने के लिए आपको पूरा सोर्स कोड अपलोड करने की ज़रूरत नहीं है! आपके लिए पहले से ही **कम्पाइल की हुई रेडी फ़ाइल** तैयार है:

1. रूट में मौजूद **`hostinger_public_html.zip`** (6.0 MB) को डाउनलोड करें।
2. **Hostinger hPanel** ➔ **File Manager** ➔ **`public_html`** फ़ोल्डर में जाएँ।
3. **`hostinger_public_html.zip`** को अपलोड करें और **Extract** (Unzip) करें।
4. Hostinger में नया MySQL Database बनाएँ और **`hostinger_database_schema.sql`** को **phpMyAdmin** में Import करें।
5. `public_html/api/config.php` में अपने Database Username और Password भरें।
6. आपका डोमेन खोलें — आपकी वेबसाइट, सभी लैब्स, रिसेप्शन, पैथोलॉजी और एडमिन पैनल तुरंत लाइव हो जाएँगे!

---

## 🔍 अलग-अलग स्क्रीन्स (Views) कैसे खोलें?
- **मुख्य वेबसाइट (Landing Page):** `https://yourdomain.com/`
- **लैब सॉफ़्टवेयर (Lab App):** ऊपर दिए गए नेवबार में **"Launch Software"** पर क्लिक करें या `https://yourdomain.com/?view=lab_app`
- **रिसेप्शन काउंटर (Reception Desk):** ऊपर नेवबार में **Login ➔ Reception Staff** चुनें या `https://yourdomain.com/?view=reception_dashboard`
- **टेक्नीशियन डेस्क (Technician Desk):** `https://yourdomain.com/?view=technician_dashboard`
- **पैथोलॉजिस्ट डेस्क (Pathologist Desk):** `https://yourdomain.com/?view=pathologist_dashboard`
- **सुपर एडमिन पैनल (Super Admin):** `https://yourdomain.com/?view=admin_dashboard` (Pass: `admin123` / `7087033009`)
- **लैब वेबसाइट (Lab Shop):** `https://yourdomain.com/shop/1020304050`

/**
 * Vendor AI Voice Bot Service
 * Strictly scoped to the active Vendor Laboratory.
 * Zero cross-tenant data access.
 * Supports Hindi, Hinglish, and English voice queries and text-to-speech.
 */

import { TestItem, VendorPackage, ReceptionPatientEntry, LabReport } from '../types';
import { isTenantMatch } from '../utils/tenantSecurity';

export interface VendorVoiceContext {
  vendorId: string;
  vendorName: string;
  tagline?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  timings?: string;
  homeCollectionEnabled?: boolean;
  homeCollectionFee?: number;
  tests: TestItem[];
  packages: VendorPackage[];
  doctors: Array<{
    name: string;
    qualification?: string;
    specialization?: string;
    designation?: string;
  }>;
  allReports?: LabReport[];
  allReceptionEntries?: ReceptionPatientEntry[];
}

export interface VoiceBotAction {
  type: 'book_test' | 'check_report' | 'book_home_collection' | 'download_app' | 'view_packages' | 'call_lab' | 'whatsapp_lab' | 'scroll_tests';
  label: string;
  payload?: any;
}

export interface VoiceBotResponse {
  reply: string;
  speechText: string;
  language: 'hi' | 'en' | 'hinglish';
  actions?: VoiceBotAction[];
  matchedItems?: {
    tests?: TestItem[];
    packages?: VendorPackage[];
    reportStatus?: string;
  };
}

/**
 * Normalizes input text for keyword and intent matching
 */
function cleanQuery(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stop words that should NEVER be used as the sole trigger for matching a specific test
 */
const GENERIC_STOP_WORDS = new Set([
  'test', 'tests', 'profile', 'blood', 'sample', 'panel', 'routine', 'rate', 'price',
  'cost', 'fee', 'charge', 'charges', 'kya', 'hai', 'hain', 'kitna', 'kitne', 'wala',
  'wali', 'ka', 'ki', 'ke', 'me', 'mein', 'se', 'ko', 'par', 'per', 'pe', 'check',
  'batao', 'dijiye', 'chahiye', 'karwana', 'karwao', 'hoga', 'hogi', 'karna', 'padega',
  'available', 'karo', 'kare', 'kaise', 'kab', 'aur', 'or', 'the', 'is', 'for', 'of', 'in'
]);

/**
 * High-fidelity, instant local domain knowledge processor.
 * Always strictly grounded in the provided vendor context only.
 */
export function processVendorVoiceQuery(
  rawQuery: string,
  context: VendorVoiceContext
): VoiceBotResponse {
  const query = cleanQuery(rawQuery);
  const vName = context.vendorName || 'हमारी डायग्नोस्टिक लैब';
  const phone = context.phone || context.whatsapp || '';
  const whatsapp = context.whatsapp || phone || '';
  const timings = context.timings || 'सुबह 07:00 AM से रात 09:00 PM तक (सोमवार से रविवार)';
  const address = context.address || 'मुख्य शाखा, शहर केंद्र';
  const tests = context.tests || [];
  const packages = context.packages || [];
  const doctors = context.doctors || [];

  // Action helpers
  const callAction: VoiceBotAction | null = phone ? { type: 'call_lab', label: `📞 कॉल करें (${phone})`, payload: { phone } } : null;
  const whatsappAction: VoiceBotAction | null = whatsapp ? { type: 'whatsapp_lab', label: '💬 व्हाट्सएप पर पूछें', payload: { phone: whatsapp } } : null;
  const testListAction: VoiceBotAction = { type: 'scroll_tests', label: '🩸 सभी टेस्ट्स देखें' };
  const homeColAction: VoiceBotAction = { type: 'book_home_collection', label: '🏠 होम कलेक्शन बुक करें' };
  const checkRepAction: VoiceBotAction = { type: 'check_report', label: '🔍 रिपोर्ट चेक करें' };
  const packagesAction: VoiceBotAction = { type: 'view_packages', label: '📦 हेल्थ पैकेजेस देखें' };

  // 1. Check if user is asking about other labs or competitors
  const otherVendorsTriggers = [
    'dusre lab', 'dusra lab', 'doosri lab', 'other lab', 'another vendor', 'lal path', 'dr lal', 'thyrocare', 'metropolis', 'apollo'
  ];
  if (otherVendorsTriggers.some(t => query.includes(t))) {
    const text = `मैं केवल ${vName} का समर्पित AI Voice Assistant हूँ। मैं किसी अन्य लैब या वेंडर का डेटा एक्सेस नहीं करता। ${vName} के टेस्ट, पैकेज या रिपोर्ट से जुड़ी कोई भी जानकारी मुझसे पूछ सकते हैं।`;
    return {
      reply: text,
      speechText: text,
      language: 'hinglish',
      actions: [testListAction, homeColAction]
    };
  }

  // 2. Greeting / Hello / Who are you / Start
  if (
    query === '' ||
    ['hello', 'hi', 'namaste', 'namaskar', 'pranam', 'helo', 'hey', 'kaun ho', 'who are you', 'tum kaun ho', 'aap kaun ho', 'shuru', 'madad', 'help'].some(
      g => query === g || query.startsWith(g + ' ')
    )
  ) {
    const reply = `नमस्ते! मैं ${vName} का AI Voice Assistant हूँ 🎙️।\n\nआप मुझसे बोलकर या लिखकर पूछ सकते हैं:\n• किसी भी टेस्ट का रेट व फास्टिंग नियम (जैसे CBC, Sugar, Thyroid)\n• होम सैंपल कलेक्शन बुकिंग\n• फुल बॉडी हेल्थ चेकअप पैकेजेस\n• लैब का समय, पता व फोन नंबर\n• अपनी रिपोर्ट का ऑनलाइन स्टेटस`;
    const speech = `नमस्ते! मैं ${vName} का एआई वॉयस असिस्टेंट हूँ। आप मुझसे टेस्ट का रेट, फास्टिंग, होम कलेक्शन, पैकेजेस या रिपोर्ट के बारे में बोलकर पूछ सकते हैं।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [testListAction, packagesAction, homeColAction, checkRepAction]
    };
  }

  // 3. Contact Info / Phone Number / WhatsApp / Call / Helpline
  const isContactInquiry = [
    'contact', 'phone', 'mobile', 'call', 'helpline', 'whatsapp', 'number', 'phone number',
    'contact number', 'sampark', 'baat karni', 'talk', 'customer care', 'toll free', 'call kare'
  ].some(w => query.includes(w));
  if (isContactInquiry) {
    const reply = `📞 ${vName} का संपर्क सूत्र:\n• फोन / हेल्पलाइन: ${phone || 'वेबसाइट पर उपलब्ध'}\n• व्हाट्सएप: ${whatsapp || phone || 'उपलब्ध'}\n• पता: ${address}\n• कार्य समय: ${timings}\n\nआप नीचे दिए बटन से सीधे हमें कॉल या व्हाट्सएप मैसेज कर सकते हैं।`;
    const speech = `${vName} का हेल्पलाइन नंबर है: ${phone || 'वेबसाइट पर देखें'}। आप अभी नीचे दिए बटन से कॉल या व्हाट्सएप कर सकते हैं।`;
    const actions: VoiceBotAction[] = [];
    if (callAction) actions.push(callAction);
    if (whatsappAction) actions.push(whatsappAction);
    actions.push(homeColAction);
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions
    };
  }

  // 4. Address / Location / Where is the lab / Direction
  const isAddressInquiry = ['address', 'पता', 'kahan hai', 'kahan', 'location', 'jagah', 'kidhar', 'map', 'direction', 'landmark', 'city', 'centre', 'center'].some(w => query.includes(w));
  if (isAddressInquiry) {
    const reply = `📍 ${vName} का पता:\n${address}\n\n• फोन संपर्क: ${phone || 'उपलब्ध'}\n• लैब का समय: ${timings}\n• ईमेल: ${context.email || 'उपलब्ध नहीं'}\n\nयदि आप लैब नहीं आ सकते तो आप घर बैठे होम कलेक्शन भी बुक कर सकते हैं।`;
    const speech = `${vName} का पता है: ${address}। हमारी लैब ${timings} तक खुली रहती है।`;
    const actions: VoiceBotAction[] = [];
    if (callAction) actions.push(callAction);
    actions.push(homeColAction);
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions
    };
  }

  // 5. Lab Timing / Hours / Open / Close / Sunday
  const isTimingInquiry = ['timing', 'टाइमिंग', 'time', 'समय', 'open', 'close', 'khulti', 'khulega', 'band', 'hours', 'kab khulti', 'kab khulta', 'sunday', 'रविवार', 'schedule', 'holiday', 'chhutti'].some(w => query.includes(w));
  if (isTimingInquiry) {
    const reply = `🕒 ${vName} के खुलने का समय:\n• नियमित समय: ${timings}\n• होम सैंपल कलेक्शन: सुबह 06:30 AM से शुरू\n• इमरजेंसी सुविधाएं: 24x7 उपलब्ध\n\nसंडे को भी लैब खुली रहती है। अधिक जानकारी के लिए सीधे कॉल करें: ${phone || 'वेबसाइट'}`;
    const speech = `${vName} के खुलने का समय ${timings} है। होम कलेक्शन सुबह 06:30 से शुरू होता है।`;
    const actions: VoiceBotAction[] = [];
    if (callAction) actions.push(callAction);
    actions.push(homeColAction);
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions
    };
  }

  // 6. Fasting Rules / Bhookhe pet / Khana khana
  const isFastingInquiry = [
    'fasting', 'फास्टिंग', 'bhookhe pet', 'bhukhe pet', 'khana khaye', 'khana khana',
    'fasting karni', 'fasting chahiye', 'pani pi sakte', 'paani pee', 'bina khaye'
  ].some(w => query.includes(w));
  if (isFastingInquiry && !query.includes('sugar') && !query.includes('cbc')) {
    const reply = `🧪 *फास्टिंग (भूखे पेट) नियम व गाइडलाइन्स:*\n\n1. *इन टेस्ट्स में 10-12 घंटे की फास्टिंग जरूरी है:*\n• Fasting Blood Sugar (FBS)\n• Lipid Profile (कोलेस्ट्रॉल/ट्राइग्लिसराइड्स)\n• Liver Function Test (LFT)\n\n2. *इनमें फास्टिंग की जरूरत नहीं (कभी भी करवाएं):*\n• CBC (Complete Blood Count)\n• Thyroid Profile (T3, T4, TSH)\n• HbA1c (3 माह की शुगर)\n• Kidney Function (KFT/Creatinine)\n• Urine Test & Vitamin D/B12\n\n💡 फास्टिंग के दौरान आप सादा पानी पी सकते हैं, परंतु चाय, दूध या नाश्ता न लें।`;
    const speech = `शुगर फास्टिंग और लिपिड प्रोफाइल के लिए 10 से 12 घंटे की भूखे पेट जांच जरूरी है। जबकि CBC, थायराइड, HbA1c और यूरिन टेस्ट बिना फास्टिंग के कभी भी करवा सकते हैं।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [homeColAction, testListAction]
    };
  }

  // 7. Report turnaround time (Kab aayegi / Kitni der me)
  const isTatInquiry = (['kab aayegi', 'kitni der', 'kitne time', 'delivery', 'kab milegi', 'der me', 'timing'] .some(w => query.includes(w)) && query.includes('report'));
  if (isTatInquiry) {
    const reply = `⏱️ *${vName} में रिपोर्ट मिलने का समय:*\n\n• *रूटीन टेस्ट्स (Same Day):* CBC, Blood Sugar, LFT, KFT, Urine आदि की रिपोर्ट उसी दिन 4 से 6 घंटे में तैयार हो जाती है।\n• *स्पेशल टेस्ट्स:* Vitamin D, Vitamin B12, Cultures में 24 से 48 घंटे लगते हैं।\n\n📲 रिपोर्ट तैयार होते ही आपके WhatsApp पर ऑटोमैटिक PDF भेज दी जाती है और आप वेबसाइट पर मोबाइल नंबर डालकर भी डाउनलोड कर सकते हैं।`;
    const speech = `रूटीन टेस्ट्स जैसे CBC और शुगर की रिपोर्ट उसी दिन 4 से 6 घंटे में मिल जाती है और आपके व्हाट्सएप पर भी आ जाती है।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [checkRepAction, callAction].filter(Boolean) as VoiceBotAction[]
    };
  }

  // 8. Check Report / Report status inquiry
  const isReportInquiry = ['report', 'रिपोर्ट', 'status', 'रिजल्ट', 'result', 'token', 'टोकन', 'barcode', 'download report'].some(w => query.includes(w));
  if (isReportInquiry) {
    // Extract numbers like token number or mobile number
    const numbersMatch = rawQuery.match(/\d{3,10}/);
    if (numbersMatch) {
      const num = numbersMatch[0];
      const tenantEntries = (context.allReceptionEntries || []).filter(e => isTenantMatch(e, context.vendorId));
      const tenantReports = (context.allReports || []).filter(r => isTenantMatch(r, context.vendorId));

      const matchedEntry = tenantEntries.find(
        e =>
          (e.tokenNumber && e.tokenNumber.toLowerCase().includes(num.toLowerCase())) ||
          (e.tokenNo && e.tokenNo.toLowerCase().includes(num.toLowerCase())) ||
          (e.uhid && e.uhid.toLowerCase().includes(num.toLowerCase())) ||
          (e.id && e.id.toLowerCase().includes(num.toLowerCase())) ||
          (e.mobile && e.mobile.includes(num))
      );

      const matchedReport = tenantReports.find(
        r =>
          (r.reportId && r.reportId.toLowerCase().includes(num.toLowerCase())) ||
          (r.tokenNumber && r.tokenNumber.toLowerCase().includes(num.toLowerCase())) ||
          (r.uhid && r.uhid.toLowerCase().includes(num.toLowerCase())) ||
          (r.mobile && r.mobile.includes(num))
      );

      if (matchedEntry || matchedReport) {
        const patientName = matchedEntry?.patientName || matchedReport?.patientName || 'मरीज';
        const status = matchedReport?.status || matchedEntry?.status || 'In Progress';
        const token = matchedEntry?.tokenNumber || matchedEntry?.tokenNo || matchedReport?.reportId || num;
        const dueAmount = matchedEntry?.dueAmount ?? (matchedReport as any)?.dueAmount ?? 0;

        let statusTextHindi = 'जांच प्रक्रिया में है';
        if (status === 'Verified' || status === 'Report Ready') statusTextHindi = 'रिपोर्ट तैयार व सत्यापित (Ready) है';
        else if (status === 'Sample Collected') statusTextHindi = 'सैंपल कलेक्ट हो चुका है, टेस्टिंग जारी है';

        const paymentNote = dueAmount > 0 ? `\n(⚠️ बकाया राशि: ₹${dueAmount} - रिपोर्ट डाउनलोड करने के लिए ड्यू क्लियर करें)` : '\n(✅ फुल पेमेंट कंप्लीट है)';

        const reply = `📄 ${vName} में टोकन/नंबर "${num}" का रिकॉर्ड मिला:\n• मरीज का नाम: ${patientName}\n• स्टेटस: ${statusTextHindi}\n• टोकन: ${token}${paymentNote}`;
        const speech = `${patientName} जी की रिपोर्ट का स्टेटस: ${statusTextHindi}। आप नीचे दिए गए बटन से सीधे रिपोर्ट देख सकते हैं।`;

        return {
          reply,
          speechText: speech,
          language: 'hinglish',
          actions: [
            { type: 'check_report', label: '📄 रिपोर्ट ऑनलाइन खोलें', payload: { token } }
          ],
          matchedItems: { reportStatus: String(status) }
        };
      }
    }

    // Generic report check instructions
    const reply = `📄 ${vName} की रिपोर्ट आप वेबसाइट पर 2 तरीकों से तुरंत देख सकते हैं:\n1. अपना 10 अंकों का मोबाइल नंबर डालकर\n2. अपनी रसीद का टोकन नंबर / रिपोर्ट आईडी डालकर\n\nआप "रिपोर्ट चेक करें" बटन पर क्लिक करके सीधे अपना टोकन या मोबाइल नंबर डाल सकते हैं।`;
    const speech = `${vName} की रिपोर्ट आप अपना मोबाइल नंबर या टोकन नंबर डालकर तुरंत ऑनलाइन देख सकते हैं।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [checkRepAction]
    };
  }

  // 9. Home Sample Collection
  const isHomeCollectionInquiry = ['home', 'होम', 'ghar', 'घर', 'sample collection', 'collection', 'ghar pe', 'blood test at home', 'ghr se', 'home visit', 'doorstep'].some(w => query.includes(w));
  if (isHomeCollectionInquiry) {
    const feeText = context.homeCollectionFee && context.homeCollectionFee > 0 ? `मात्र ₹${context.homeCollectionFee} (सीनियर सिटीजन व बड़े पैकेज पर निःशुल्क)` : 'बिलकुल निःशुल्क (FREE) उपलब्ध है';
    const reply = `🏠 ${vName} में घर बैठे होम सैंपल कलेक्शन सुविधा उपलब्ध है!\n• शुल्क: ${feeText}\n• समय: सुबह 06:30 AM से शाम 07:00 PM तक\n• 100% स्टरलाइज्ड नीडल व वैक्यूटेनर के साथ प्रशिक्षित फ्लेबोटोमिस्ट आएंगे।\n\nआप नीचे दिए बटन से तुरंत ऑनलाइन होम कलेक्शन बुक कर सकते हैं या सीधे फोन करें: ${phone || 'हेल्पलाइन'}`;
    const speech = `${vName} में घर बैठे ब्लड और यूरिन सैंपल कलेक्शन उपलब्ध है। आप अभी ऑनलाइन या फोन करके होम विजिट बुक कर सकते हैं।`;
    const actions: VoiceBotAction[] = [homeColAction];
    if (whatsappAction) actions.push(whatsappAction);
    if (callAction) actions.push(callAction);
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions
    };
  }

  // 10. Doctors / Pathologists inquiry
  const isDoctorInquiry = ['doctor', 'डॉक्टर', 'pathologist', 'पैथोलॉजिस्ट', 'dr', 'team', 'consultant', 'kaun doctor', 'dr naam', 'nabl'].some(w => query.includes(w));
  if (isDoctorInquiry) {
    if (doctors.length > 0) {
      const docList = doctors.map(d => `• ${d.name} (${d.qualification || 'MBBS, MD Pathologist'}${d.specialization ? ` - ${d.specialization}` : ''})`).join('\n');
      const reply = `👨‍⚕️ ${vName} के कंसल्टिंग पैथोलॉजिस्ट व डॉक्टर्स:\n\n${docList}\n\nसभी टेस्ट्स आधुनिक फुली-ऑटोमेटेड मशीनों से किए जाते हैं और रिपोर्ट योग्य पैथोलॉजिस्ट द्वारा डिजिटल रूप से सत्यापित की जाती है।`;
      const speech = `${vName} में अनुभवी पैथोलॉजिस्ट ${doctors.map(d => d.name).join(' और ')} द्वारा रिपोर्ट जांची और सत्यापित की जाती है।`;
      return {
        reply,
        speechText: speech,
        language: 'hinglish',
        actions: [testListAction, homeColAction]
      };
    }
  }

  // 11. Health Packages / Full Body Checkup / Offers inquiry
  const isPackageInquiry = ['package', 'पैकेज', 'full body', 'फुल बॉडी', 'health checkup', 'चेकअप', 'master', 'profile', 'offer', 'डिस्काउंट', 'discount', 'bada package', 'body check'].some(w => query.includes(w));
  if (isPackageInquiry) {
    if (packages.length > 0) {
      const pkgList = packages.slice(0, 3).map(p => {
        const testsCount = p.testsCount || (p.features ? p.features.length : '15+');
        const price = p.priceINR || (p as any).price || 999;
        const mrp = p.mrpINR || (p as any).regularPrice || Math.round(price * 1.5);
        return `• *${p.name}*: मात्र ₹${price} (MRP ₹${mrp}) [${testsCount} जांचें शामिल]`;
      }).join('\n');

      const reply = `📦 ${vName} के लोकप्रिय प्रिवेंटिव हेल्थ पैकेजेस:\n\n${pkgList}\n\nइन पैकेजेस में ब्लड शुगर, सीबीसी, लिवर, किडनी, लिपिड प्रोफाइल आदि शामिल रहते हैं और 40% से 60% तक की भारी बचत होती है।`;
      const speech = `${vName} में फुल बॉडी और प्रिवेंटिव हेल्थ चेकअप पैकेज विशेष छूट पर उपलब्ध हैं। सबसे लोकप्रिय पैकेज ${packages[0]?.name || ''} मात्र ₹${packages[0]?.priceINR || 999} में है।`;
      return {
        reply,
        speechText: speech,
        language: 'hinglish',
        actions: [
          packagesAction,
          { type: 'book_test', label: '📅 पैकेज बुक करें' },
          homeColAction
        ],
        matchedItems: { packages }
      };
    }
  }

  // 12. Symptoms / Conditions Search (Fever, Bukhar, Dengue, Typhoid, Weakness, Infection)
  const isFeverInquiry = ['fever', 'bukhar', 'बुखार', 'dengue', 'typhoid', 'malaria', 'infection', 'chills', 'tap'].some(w => query.includes(w));
  if (isFeverInquiry) {
    const cbcTest = tests.find(t => (t.name || '').toLowerCase().includes('cbc') || (t.name || '').toLowerCase().includes('blood count'));
    const widalTest = tests.find(t => (t.name || '').toLowerCase().includes('widal') || (t.name || '').toLowerCase().includes('typhoid'));
    const dengueTest = tests.find(t => (t.name || '').toLowerCase().includes('dengue'));

    const list: string[] = [];
    if (cbcTest) list.push(`• *Complete Blood Count (CBC & Platelets):* ₹${cbcTest.priceINR ?? (cbcTest as any).price ?? 350} (प्लेटलेट्स व इन्फेक्शन जांच)`);
    if (widalTest) list.push(`• *Widal / Typhoid Test:* ₹${widalTest.priceINR ?? (widalTest as any).price ?? 200}`);
    if (dengueTest) list.push(`• *Dengue NS1 Antigen:* ₹${dengueTest.priceINR ?? (dengueTest as any).price ?? 600}`);
    if (list.length === 0) {
      list.push(`• *Complete Blood Count (CBC):* ₹350 (प्लेटलेट्स व टीएलसी जांच)`);
      list.push(`• *Widal / Typhoid Slide:* ₹200`);
      list.push(`• *Dengue NS1 / IgM Serology:* ₹600`);
    }

    const reply = `🌡️ बुखार (Fever / Infection) में अनुशंसित प्रमुख जांचें:\n\n${list.join('\n')}\n\nइन सभी टेस्ट्स की रिपोर्ट उसी दिन (Same Day) तैयार हो जाती है। आप घर पर होम सैंपल कलेक्शन भी बुक कर सकते हैं।`;
    const speech = `बुखार के लिए सीबीसी प्लेटलेट्स, टाइफाइड और डेंगू की जांचें उपलब्ध हैं। आप घर बैठे सैंपल देने के लिए होम कलेक्शन बुक कर सकते हैं।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [homeColAction, testListAction]
    };
  }

  // 13. General Test List inquiry ("kya kya test hote hain", "all tests", "test list", "saare test")
  const isTestListInquiry = [
    'kya kya test', 'kaun se test', 'test list', 'available test', 'all test', 'saare test',
    'kaun kaun se', 'list of test', 'test menu', 'blood test list', 'test list dikhao'
  ].some(w => query.includes(w));
  if (isTestListInquiry) {
    const popularTests = tests.slice(0, 6);
    const list = popularTests.map(t => `• ${t.name || (t as any).testName}: ₹${t.priceINR ?? (t as any).price}`).join('\n');
    const reply = `🔬 ${vName} में सभी प्रकार के ब्लड, यूरिन व प्रिवेंटिव हेल्थ टेस्ट्स उपलब्ध हैं:\n\n${list}\n\nआप नीचे दिए "सभी टेस्ट्स देखें" बटन पर क्लिक करके 50+ टेस्ट्स की पूरी सूची देख सकते हैं।`;
    const speech = `${vName} में सीबीसी, शुगर, थायराइड, लिपिड, एलएफटी, केएफटी समेत सभी जांचें उपलब्ध हैं। पूरी सूची देखने के लिए नीचे दिए बटन पर क्लिक करें।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [testListAction, homeColAction]
    };
  }

  // 14. Specific Test Search (CBC, Thyroid, Sugar, LFT, KFT, Vitamin D, HbA1c, Urine, Lipid, etc.)
  // Use STRICT distinct aliases so generic words like "test" do NOT match a random test!
  const testKeywords = [
    { key: 'cbc', aliases: ['cbc', 'complete blood count', 'सीबीसी', 'hemoglobin', 'platelet', 'platelets', 'hb'] },
    { key: 'sugar', aliases: ['sugar', 'glucose', 'शुगर', 'diabetes', 'fasting sugar', 'pp sugar', 'fbs', 'ppbs', 'rbs'] },
    { key: 'hba1c', aliases: ['hba1c', 'hb a1c', 'glycated hemoglobin', '3 month sugar'] },
    { key: 'thyroid', aliases: ['thyroid', 'थायराइड', 't3', 't4', 'tsh', 'thiroide'] },
    { key: 'lipid', aliases: ['lipid', 'cholesterol', 'कोलेस्ट्रॉल', 'triglyceride', 'heart test'] },
    { key: 'lft', aliases: ['lft', 'liver function', 'लिवर', 'sgpt', 'sgot', 'bilirubin', 'jaundice', 'peeliya'] },
    { key: 'kft', aliases: ['kft', 'kidney function', 'किडनी', 'creatinine', 'urea', 'rft', 'uric acid'] },
    { key: 'vitamin d', aliases: ['vitamin d', 'vit d', 'विटामिन डी', 'd3', 'cholecalciferol'] },
    { key: 'vitamin b12', aliases: ['vitamin b12', 'vit b12', 'विटामिन b12', 'b12', 'cyanocobalamin'] },
    { key: 'urine', aliases: ['routine urine', 'urine r/m', 'urine test', 'यूरिन', 'peshab', 'urine examination'] },
    { key: 'crp', aliases: ['crp', 'c-reactive protein', 'c reactive protein'] },
    { key: 'esr', aliases: ['esr', 'erythrocyte sedimentation'] },
    { key: 'dengue', aliases: ['dengue', 'डेंगू', 'ns1', 'dengue test'] },
    { key: 'typhoid', aliases: ['typhoid', 'टाइफाइड', 'widal', 'विडाल'] },
    { key: 'malaria', aliases: ['malaria', 'मलेरिया', 'mp test', 'smear'] },
    { key: 'calcium', aliases: ['calcium', 'कैल्शियम'] },
    { key: 'electrolytes', aliases: ['electrolyte', 'electrolytes', 'sodium', 'potassium'] },
    { key: 'iron', aliases: ['iron profile', 'ferritin', 'iron test'] },
  ];

  let matchedTest: TestItem | undefined;

  for (const item of testKeywords) {
    if (item.aliases.some(a => query.includes(a))) {
      // Find in vendorTests
      matchedTest = tests.find(t => {
        const tName = (t.name || (t as any).testName || '').toLowerCase();
        return item.aliases.some(a => tName.includes(a));
      });
      break;
    }
  }

  // If not matched by keywords, try matching specific distinctive words (NOT generic stop words)
  if (!matchedTest) {
    matchedTest = tests.find(t => {
      const words = (t.name || (t as any).testName || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 4 && !GENERIC_STOP_WORDS.has(w));
      return words.some(w => query.includes(w));
    });
  }

  if (matchedTest) {
    const testName = matchedTest.name || (matchedTest as any).testName;
    const fasting = matchedTest.fastingRequired ? '10-12 घंटे की भूखे पेट (Fasting) जांच आवश्यक है' : 'फास्टिंग की आवश्यकता नहीं है (कभी भी करवा सकते हैं)';
    const tat = matchedTest.turnaroundTime || (matchedTest as any).deliveryTime || 'उसी दिन (Same Day)';
    const sample = matchedTest.sampleType || 'ब्लड (Blood Serum)';
    const price = matchedTest.priceINR ?? (matchedTest as any).price ?? 350;

    const reply = `🔬 ${vName} में *${testName}* की जानकारी:\n• मूल्य (Price): ₹${price}\n• फास्टिंग नियम: ${fasting}\n• सैंपल का प्रकार: ${sample}\n• रिपोर्ट का समय (TAT): ${tat}\n\nआप इस टेस्ट को लैब आकर या घर पर होम कलेक्शन के माध्यम से करवा सकते हैं।`;
    const speech = `${vName} में ${testName} का मूल्य ₹${price} है। ${fasting}। रिपोर्ट ${tat} में मिल जाती है।`;

    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [
        { type: 'book_test', label: `📅 ${testName} बुक करें`, payload: { testId: matchedTest.id, testName } },
        homeColAction
      ],
      matchedItems: { tests: [matchedTest] }
    };
  }

  // 15. Generic Price / Rate inquiry
  if (['price', 'rate', 'cost', 'kitna', 'kitne', 'खर्चा', 'रेट', 'दाम', 'रुपये', 'rupees'].some(w => query.includes(w))) {
    const popularTests = tests.slice(0, 4);
    const list = popularTests.map(t => `• ${t.name || (t as any).testName}: ₹${t.priceINR ?? (t as any).price}`).join('\n');
    const firstPrice = popularTests[0]?.priceINR ?? (popularTests[0] as any)?.price ?? 350;
    const secondPrice = popularTests[1]?.priceINR ?? (popularTests[1] as any)?.price ?? 80;
    const reply = `💰 ${vName} के कुछ प्रमुख टेस्ट्स और उनके रेट:\n\n${list}\n\nकिसी खास टेस्ट (जैसे CBC, Thyroid, Sugar, LFT, KFT) का रेट जानने के लिए आप उस टेस्ट का नाम बोल सकते हैं।`;
    const speech = `${vName} में सभी जांचें उचित दरों पर उपलब्ध हैं। जैसे CBC ₹${firstPrice}, Sugar ₹${secondPrice}। आप किसी भी टेस्ट का नाम बोलकर रेट पूछ सकते हैं।`;
    return {
      reply,
      speechText: speech,
      language: 'hinglish',
      actions: [testListAction, packagesAction]
    };
  }

  // 16. Fallback helpful guidance strictly in context
  const reply = `नमस्ते! मैं ${vName} का AI Voice Assistant हूँ।\nमैं आपको हमारे टेस्ट रेट्स, फास्टिंग नियम, होम कलेक्शन, फुल बॉडी पैकेजेस, लैब टाइमिंग या रिपोर्ट स्टेटस की सटीक जानकारी दे सकता हूँ।\n\nआप बोल सकते हैं:\n• "CBC का रेट क्या है?"\n• "होम कलेक्शन कैसे बुक करें?"\n• "लैब का पता व फोन नंबर क्या है?"`;
  const speech = `नमस्ते, मैं ${vName} के टेस्ट रेट्स, होम कलेक्शन, पैकेजेस या रिपोर्ट स्टेटस की जानकारी दे सकता हूँ। आप बोलकर पूछ सकते हैं।`;

  return {
    reply,
    speechText: speech,
    language: 'hinglish',
    actions: [testListAction, homeColAction, checkRepAction]
  };
}

/**
 * Sends request to backend /api/ai/voice-chat which calls Gemini API (server-side)
 * with graceful fallback to processVendorVoiceQuery.
 */
export async function askVendorVoiceBot(
  query: string,
  context: VendorVoiceContext,
  language: 'hi' | 'en' | 'hinglish' = 'hinglish'
): Promise<VoiceBotResponse> {
  // Always prepare instant local answer as benchmark / fallback
  const localAnswer = processVendorVoiceQuery(query, context);

  try {
    const testsSummary = (context.tests || []).slice(0, 30).map(t => ({
      name: t.name || (t as any).testName,
      price: t.priceINR ?? (t as any).price,
      fasting: t.fastingRequired,
      tat: t.turnaroundTime || (t as any).deliveryTime
    }));

    const packagesSummary = (context.packages || []).slice(0, 8).map(p => ({
      name: p.name,
      price: p.priceINR || (p as any).price,
      regularPrice: p.mrpINR || (p as any).regularPrice
    }));

    const doctorsSummary = (context.doctors || []).map(d => ({
      name: d.name,
      qualification: d.qualification,
      specialization: d.specialization
    }));

    const res = await fetch('/api/ai/voice-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vendorId: context.vendorId,
        vendorName: context.vendorName,
        message: query,
        language,
        vendorContext: {
          vendorName: context.vendorName,
          phone: context.phone,
          whatsapp: context.whatsapp,
          email: context.email,
          address: context.address,
          timings: context.timings,
          homeCollectionFee: context.homeCollectionFee,
          tests: testsSummary,
          packages: packagesSummary,
          doctors: doctorsSummary
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.reply && typeof data.reply === 'string' && data.reply.trim().length > 0) {
        return {
          reply: data.reply,
          speechText: data.speechText || data.reply.replace(/[*#•_-]/g, ' '),
          language,
          actions: data.actions || localAnswer.actions,
          matchedItems: localAnswer.matchedItems
        };
      }
    }
  } catch (err) {
    console.warn('[Vendor Voice Bot] Backend call skipped or offline, using local domain intelligence:', err);
  }

  return localAnswer;
}

/**
 * Text-to-Speech synthesizer with Hindi / Indian English voice support
 */
export class VoiceSpeaker {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static speak(
    text: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
      rate?: number;
    } = {}
  ): void {
    if (!this.synth) {
      if (options.onEnd) options.onEnd();
      return;
    }

    try {
      this.stop();

      // Clean markdown symbols, bullets, asterisks for natural voice reading
      const clean = text
        .replace(/\*/g, '')
        .replace(/[#_`~]/g, '')
        .replace(/•/g, ', ')
        .replace(/\n+/g, '. ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = options.rate || 0.95; // slightly relaxed natural pace
      utterance.pitch = 1.0;

      // Select suitable voice
      const voices = this.synth.getVoices();
      const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      const indianEngVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));

      if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = 'hi-IN';
      } else if (indianEngVoice) {
        utterance.voice = indianEngVoice;
        utterance.lang = 'en-IN';
      } else {
        utterance.lang = 'hi-IN';
      }

      utterance.onstart = () => {
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (options.onEnd) options.onEnd();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        if (options.onError) options.onError();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      if (options.onEnd) options.onEnd();
    }
  }

  public static stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
      this.currentUtterance = null;
    }
  }

  public static isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

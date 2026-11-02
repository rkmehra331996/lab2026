<?php
/**
 * Dynamic OpenGraph & Meta Tag Injector for INDIANLALAJI.COM
 * 
 * When a patient report or vendor lab website link is shared (WhatsApp, Facebook, Twitter, Telegram, SMS),
 * this script intercepts the request and injects the VENDOR's Lab Name, Description, and Feature Image
 * into the HTML meta tags before serving it.
 * 
 * For the main platform homepage (/), it preserves the default IndianLalaji branding.
 */

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?: '/';

function sanitize_og($str) {
    return htmlspecialchars(strip_tags((string)$str), ENT_QUOTES, 'UTF-8');
}

$rawShop = '';
$token = '';

// 1. Detect /shop/:shop/report/:token or /report/:token
if (preg_match('#^/(?:shop|lab|labs|vendor|v)/([^/?#]+)/(?:report|reports)/([^/?#]+)#i', $path, $matches)) {
    $rawShop = urldecode($matches[1]);
    $token = urldecode($matches[2]);
} elseif (preg_match('#^/(?:report|reports)/([^/?#]+)#i', $path, $matches)) {
    $token = urldecode($matches[1]);
    $rawShop = $_GET['shop'] ?? $_GET['lab'] ?? '';
} elseif (preg_match('#^/(?:shop|lab|labs|vendor|v)/([^/?#]+)#i', $path, $matches)) {
    $rawShop = urldecode($matches[1]);
} elseif (!empty($_GET['lab']) || !empty($_GET['shop'])) {
    $rawShop = $_GET['lab'] ?? $_GET['shop'];
    $token = $_GET['report'] ?? $_GET['token'] ?? '';
}

$htmlFile = __DIR__ . '/index.html';
if (!file_exists($htmlFile)) {
    http_response_code(404);
    echo "index.html not found";
    exit;
}
$html = file_get_contents($htmlFile);

if (!empty($rawShop) || !empty($token)) {
    $labsFile = __DIR__ . '/api/data/vendor_labs.json';
    $settingsFile = __DIR__ . '/api/data/lab_settings.json';

    $vendorLabs = [];
    $labSettings = [];

    if (file_exists($labsFile)) {
        $vendorLabs = json_decode(file_get_contents($labsFile), true) ?: [];
    }
    if (file_exists($settingsFile)) {
        $labSettings = json_decode(file_get_contents($settingsFile), true) ?: [];
    }

    $cleanTarget = strtolower(trim((string)$rawShop));
    $cleanDigits = preg_replace('/\D/', '', $cleanTarget);
    $clean10 = strlen($cleanDigits) >= 10 ? substr($cleanDigits, -10) : '';

    $matchedLab = null;
    foreach ($vendorLabs as $l) {
        $id = strtolower($l['id'] ?? '');
        $slug = strtolower($l['slug'] ?? '');
        $dp = strtolower($l['domainPreview'] ?? '');
        $phoneDigits = preg_replace('/\D/', '', $l['phone'] ?? '');

        if ($id === $cleanTarget ||
            $id === 'lab-' . $cleanTarget ||
            preg_replace('/^lab-/', '', $id) === preg_replace('/^lab-/', '', $cleanTarget) ||
            $slug === $cleanTarget ||
            strpos($dp, $cleanTarget) !== false ||
            (!empty($clean10) && substr($phoneDigits, -10) === $clean10)) {
            $matchedLab = $l;
            break;
        }
    }

    // Fallback: if token exists but shop not matched, use first active lab
    if (!$matchedLab && !empty($token) && !empty($vendorLabs)) {
        $matchedLab = $vendorLabs[0];
    }

    if ($matchedLab) {
        $labId = $matchedLab['id'] ?? '';
        $settings = [];
        if (is_array($labSettings)) {
            if (isset($labSettings[$labId])) {
                $settings = $labSettings[$labId];
            } else {
                foreach ($labSettings as $s) {
                    if (($s['labId'] ?? $s['id'] ?? '') === $labId) {
                        $settings = $s;
                        break;
                    }
                }
            }
        }

        $labName = $settings['labName'] ?? $matchedLab['name'] ?? 'Diagnostic Laboratory';
        $tagline = $settings['tagline'] ?? $matchedLab['tagline'] ?? 'Advanced Clinical Pathology & Digital Reports';

        $featureImage = $settings['featureImageUrl'] ?? $settings['ogImageUrl'] ?? $settings['logoUrl'] ?? $matchedLab['logoUrl'] ?? '';
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'indianlalaji.com';

        if (!empty($featureImage)) {
            if (strpos($featureImage, 'http') !== 0) {
                $featureImage = $protocol . '://' . $host . (strpos($featureImage, '/') === 0 ? '' : '/') . $featureImage;
            }
        } else {
            // High quality medical laboratory banner if no vendor custom image yet
            $featureImage = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80';
        }

        if (!empty($token)) {
            $title = $labName . ' - Verified Diagnostic Report (' . $token . ')';
            $desc = 'Official medical diagnostic laboratory report (Token #' . $token . ') by ' . $labName . '. Certified and ready for digital verification & instant PDF download.';
        } else {
            $title = $labName . ' - Official Diagnostic Testing & Pathology Portal';
            $desc = $tagline . '. NABL accredited pathology services with automated WhatsApp reports, INR billing, and doorstep sample collection.';
        }

        $fullUrl = $protocol . '://' . $host . $requestUri;

        // Dynamic Tag Replacements
        $html = preg_replace('/<title>.*?<\/title>/i', '<title>' . sanitize_og($title) . '</title>', $html);
        $html = preg_replace('/<meta\s+name=["\']description["\']\s+content=["\'].*?["\']\s*\/?>/i', '<meta name="description" content="' . sanitize_og($desc) . '" />', $html);
        $html = preg_replace('/<meta\s+property=["\']og:title["\']\s+content=["\'].*?["\']\s*\/?>/i', '<meta property="og:title" content="' . sanitize_og($title) . '" />', $html);
        $html = preg_replace('/<meta\s+property=["\']og:description["\']\s+content=["\'].*?["\']\s*\/?>/i', '<meta property="og:description" content="' . sanitize_og($desc) . '" />', $html);
        $html = preg_replace('/<meta\s+property=["\']og:image["\']\s+content=["\'].*?["\']\s*\/?>/i', '<meta property="og:image" content="' . sanitize_og($featureImage) . '" />', $html);
        $html = preg_replace('/<meta\s+property=["\']og:url["\']\s+content=["\'].*?["\']\s*\/?>/i', '<meta property="og:url" content="' . sanitize_og($fullUrl) . '" />', $html);
        $html = preg_replace('/<meta\s+name=["\']twitter:title["\']\s+content=["\'].*?["\']\s*\/?>/i', '<meta name="twitter:title" content="' . sanitize_og($title) . '" />', $html);
        $html = preg_replace('/<meta\s+name=["\']twitter:description["\']\s+content=["\'].*?["\']\s*\/?>/i', '<meta name="twitter:description" content="' . sanitize_og($desc) . '" />', $html);
        $html = preg_replace('/<meta\s+name=["\']twitter:image["\']\s+content=["\'].*?["\']\s*\/?>/i', '<meta name="twitter:image" content="' . sanitize_og($featureImage) . '" />', $html);
    }
}

// Serve customized response
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
header('Pragma: no-cache');
header('Expires: 0');
echo $html;
exit;

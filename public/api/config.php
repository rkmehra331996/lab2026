<?php
/**
 * INDIANLALAJI.COM - Hostinger Server & Database Configuration
 * Handles Hostinger MySQL Database Connection with Automatic FileStorage Fallback
 */

// Enable error reporting for debugging
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');

// CORS Headers - Allow cross-origin requests from all lab subdomains, mobile devices & preview apps
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma");
header("Content-Type: application/json; charset=UTF-8");

// Strict Anti-Cache Headers: Force Hostinger CDN and Browsers to never cache dynamic API responses
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0");
header("Pragma: no-cache");
header("Expires: 0");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// -----------------------------------------------------------------------------
// 1. Hostinger Database Credentials
// -----------------------------------------------------------------------------
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'u878081993_newkonhai'); // Hostinger MySQL Username
define('DB_PASS', getenv('DB_PASS') ?: 'Newkonhai12');   // Hostinger MySQL Password
define('DB_NAME', getenv('DB_NAME') ?: 'u878081993_newkonhai'); // Hostinger MySQL Database Name

// Directories
define('DATA_DIR', __DIR__ . '/data');
define('UPLOADS_DIR', __DIR__ . '/../uploads');

// Ensure storage directories exist
if (!file_exists(DATA_DIR)) {
    @mkdir(DATA_DIR, 0755, true);
}
if (!file_exists(UPLOADS_DIR)) {
    @mkdir(UPLOADS_DIR, 0755, true);
}

// -----------------------------------------------------------------------------
// 2. Database Connection Helper (PDO with Graceful Fallback)
// -----------------------------------------------------------------------------
$pdo = null;
$storageMode = 'file';

try {
    if (defined('DB_USER') && DB_USER) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 2
        ]);
        $storageMode = 'mysql';
    }
} catch (Exception $e) {
    $pdo = null;
    $storageMode = 'file';
}

function getDbConnection() {
    global $pdo;
    return $pdo;
}

function getStorageMode() {
    global $storageMode;
    return $storageMode;
}

/**
 * JSON File Storage Helper - Reads a collection
 */
function readCollectionFile($collection) {
    $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', $collection);
    $filePath = DATA_DIR . '/' . $safeName . '.json';
    if (!file_exists($filePath)) {
        return [];
    }
    $content = @file_get_contents($filePath);
    if (!$content) return [];
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

/**
 * JSON File Storage Helper - Writes a collection with flock
 */
function writeCollectionFile($collection, $data) {
    $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', $collection);
    $filePath = DATA_DIR . '/' . $safeName . '.json';
    $fp = @fopen($filePath, 'c+');
    if ($fp) {
        if (flock($fp, LOCK_EX)) {
            ftruncate($fp, 0);
            fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            fflush($fp);
            flock($fp, LOCK_UN);
        }
        fclose($fp);
    }
    
    // Update global sync timestamp and track per-collection update
    $now = round(microtime(true) * 1000);
    $meta = getSyncMetadata();
    $meta['lastUpdated'] = $now;
    if (!isset($meta['collections']) || !is_array($meta['collections'])) {
        $meta['collections'] = [];
    }
    $meta['collections'][$collection] = $now;
    $metaFile = DATA_DIR . '/_meta.json';
    @file_put_contents($metaFile, json_encode($meta, JSON_PRETTY_PRINT));
}

/**
 * Get Global Sync Timestamp and per-collection timestamps
 */
function getSyncMetadata() {
    $metaFile = DATA_DIR . '/_meta.json';
    if (file_exists($metaFile)) {
        $meta = @json_decode(@file_get_contents($metaFile), true);
        if (is_array($meta)) return $meta;
    }
    return [
        'lastUpdated' => round(microtime(true) * 1000),
        'collections' => []
    ];
}

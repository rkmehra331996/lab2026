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
$dbConfigFile = __DIR__ . '/data/db_config.json';
$customConfig = [];
if (file_exists($dbConfigFile)) {
    $customConfig = @json_decode(@file_get_contents($dbConfigFile), true) ?: [];
}

define('DB_HOST', getenv('DB_HOST') ?: ($customConfig['dbHost'] ?? 'localhost'));
define('DB_USER', getenv('DB_USER') ?: ($customConfig['dbUser'] ?? 'u878081993_newkonhai')); // Hostinger MySQL Username
define('DB_PASS', getenv('DB_PASS') ?: ($customConfig['dbPassword'] ?? ($customConfig['dbPass'] ?? 'Newkonhai12')));   // Hostinger MySQL Password
define('DB_NAME', getenv('DB_NAME') ?: ($customConfig['dbName'] ?? 'u878081993_newkonhai')); // Hostinger MySQL Database Name

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
// 2. Database Connection Helper (PDO with Graceful Fallback & Auto-Bootstrap)
// -----------------------------------------------------------------------------
$pdo = null;
$storageMode = 'file';
$dbError = null;
$connectedHost = null;

function logMySqlError($context, $message, $query = '') {
    $errFile = DATA_DIR . '/last_mysql_error.json';
    $errData = [
        'timestamp' => date('c'),
        'context' => $context,
        'message' => $message,
        'query' => substr((string)$query, 0, 500),
    ];
    @file_put_contents($errFile, json_encode($errData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function getLastMySqlError() {
    $errFile = DATA_DIR . '/last_mysql_error.json';
    if (file_exists($errFile)) {
        return @json_decode(@file_get_contents($errFile), true);
    }
    return null;
}

if (defined('DB_USER') && DB_USER && DB_NAME) {
    // Check if MySQL connection failed recently (cooldown prevents hanging every request when DB is offline)
    $cooldownFile = DATA_DIR . '/mysql_down.tmp';
    $skipMySql = false;
    if (file_exists($cooldownFile)) {
        $failedTime = (int)@file_get_contents($cooldownFile);
        if (time() - $failedTime < 25) {
            $skipMySql = true;
            $dbError = 'MySQL temporary cooldown active; fast JSON file fallback in use';
            $storageMode = 'file';
        }
    }

    if (!$skipMySql) {
        $primaryHost = DB_HOST ?: 'localhost';
        try {
            $dsn = "mysql:host=" . $primaryHost . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 2
            ]);
            $storageMode = 'mysql';
            $connectedHost = $primaryHost;
            $dbError = null;
            if (file_exists($cooldownFile)) {
                @unlink($cooldownFile);
            }
        } catch (Exception $e) {
            $dbError = $e->getMessage();
            $pdo = null;
            $storageMode = 'file';
            @file_put_contents($cooldownFile, (string)time());
            logMySqlError('pdo_connect', $dbError, DB_USER . '@' . $primaryHost);
        }
    }

    if ($pdo) {
        autoBootstrapDatabaseTables($pdo);
    }
}

function autoBootstrapDatabaseTables($pdoInstance) {
    if (!$pdoInstance) return;
    $bootstrapMarker = DATA_DIR . '/.bootstrapped_' . md5(DB_NAME . DB_USER);
    if (file_exists($bootstrapMarker)) {
        return; // Already bootstrapped; skip expensive SHOW TABLES on every request
    }

    try {
        $schemaFile = __DIR__ . '/schema.sql';
        if (file_exists($schemaFile)) {
            $sql = file_get_contents($schemaFile);
            $sql = preg_replace('!/\*.*?\*/!s', '', $sql);
            $lines = explode("\n", $sql);
            $cleanSql = '';
            foreach ($lines as $line) {
                $t = trim($line);
                if (strpos($t, '--') === 0 || strpos($t, '#') === 0) continue;
                $cleanSql .= $line . "\n";
            }
            $queries = array_filter(array_map('trim', explode(';', $cleanSql)));
            foreach ($queries as $q) {
                if (!empty($q)) {
                    try {
                        $pdoInstance->exec($q);
                    } catch (\Exception $e) {
                        logMySqlError('schemaBootstrapQuery', $e->getMessage(), $q);
                    }
                }
            }
            @file_put_contents($bootstrapMarker, date('c'));
        }
    } catch (\Exception $e) {
        logMySqlError('autoBootstrap', $e->getMessage());
    }
}

function getDbConnection() {
    global $pdo;
    return $pdo;
}

function getStorageMode() {
    global $storageMode;
    return $storageMode;
}

function getDbConnectionError() {
    global $dbError;
    return $dbError;
}

function getConnectedHost() {
    global $connectedHost;
    return $connectedHost;
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
 * JSON File Storage Helper - Writes a collection atomically without blocking locks
 */
function writeCollectionFile($collection, $data) {
    $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', $collection);
    $filePath = DATA_DIR . '/' . $safeName . '.json';
    $tempFile = $filePath . '.' . uniqid('tmp_', true);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($json !== false) {
        if (@file_put_contents($tempFile, $json) !== false) {
            @rename($tempFile, $filePath);
        } else {
            @file_put_contents($filePath, $json);
        }
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

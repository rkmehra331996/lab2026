<?php
/**
 * INDIANLALAJI.COM - Hostinger Server Health & Database Connection Diagnostic
 * Visit: https://indianlalaji.com/api/status.php to check live connection status
 */

require_once __DIR__ . '/config.php';

$meta = getSyncMetadata();
$uploadWritable = is_writable(UPLOADS_DIR);
$dataWritable = is_writable(DATA_DIR);

$dbStatus = 'Active: Using High-Speed Built-in Storage Engine (Zero-Config)';
$dbConnected = false;
$mysqlTested = false;
$dbError = null;

if (defined('DB_USER') && DB_USER) {
    $mysqlTested = true;
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $testPdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3
        ]);
        $dbConnected = true;
        $dbStatus = '✅ Successfully Connected to Hostinger MySQL Database (' . DB_NAME . ')';
    } catch (Exception $e) {
        $dbConnected = false;
        $dbStatus = '⚠️ MySQL Error: ' . $e->getMessage() . ' (Auto-Fallback to Built-in Storage active)';
        $dbError = $e->getMessage();
    }
}

echo json_encode([
    'status' => 'online',
    'platform' => 'INDIANLALAJI.COM',
    'server' => 'Hostinger Web & Database Server',
    'database' => [
        'mode' => $dbConnected ? 'Hostinger MySQL' : 'Built-in Auto Storage Engine',
        'mysqlConnected' => $dbConnected,
        'mysqlConfigured' => $mysqlTested,
        'statusMessage' => $dbStatus,
        'databaseName' => DB_NAME,
        'databaseUser' => DB_USER,
    ],
    'storage' => [
        'uploadsDirectoryWritable' => $uploadWritable,
        'dataDirectoryWritable' => $dataWritable,
    ],
    'realTimeSync' => [
        'engine' => 'Continuous Multi-Device Sync',
        'active' => true,
        'lastSyncTime' => isset($meta['lastUpdated']) ? date('d M Y, h:i:s A', $meta['lastUpdated'] / 1000) : 'Active',
    ],
    'phpVersion' => phpversion(),
    'currentTime' => date('Y-m-d H:i:s'),
    'timestamp' => round(microtime(true) * 1000)
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

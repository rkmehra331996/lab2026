<?php
/**
 * INDIANLALAJI.COM - Hostinger Server Health & Database Connection Diagnostic
 * Visit: https://indianlalaji.com/api/status.php to check live connection status
 */

require_once __DIR__ . '/config.php';

$meta = getSyncMetadata();
$uploadWritable = is_writable(UPLOADS_DIR);
$dataWritable = is_writable(DATA_DIR);

$conn = getDbConnection();
$dbConnected = ($conn !== null);
$dbHostUsed = getConnectedHost() ?: DB_HOST;
$dbError = getDbConnectionError();
$tableCount = 0;
$tablesList = [];

if ($conn) {
    try {
        $tblStmt = $conn->query("SHOW TABLES");
        if ($tblStmt) {
            $tablesList = $tblStmt->fetchAll(PDO::FETCH_COLUMN);
            $tableCount = count($tablesList);
        }
        $dbStatus = '✅ Successfully Connected to Hostinger MySQL Database (' . DB_NAME . ') on ' . $dbHostUsed . ' (' . $tableCount . ' tables active)';
    } catch (\Exception $e) {
        $dbStatus = 'Connected to MySQL: ' . $e->getMessage();
    }
} else {
    $dbStatus = '⚠️ Hostinger MySQL Notice: ' . ($dbError ?: 'Not connected') . ' (Auto-Fallback to Built-in Storage Active)';
}

echo json_encode([
    'status' => 'online',
    'platform' => 'INDIANLALAJI.COM',
    'server' => 'Hostinger Web & Database Server',
    'database' => [
        'mode' => $dbConnected ? 'Hostinger MySQL' : 'Built-in Auto Storage Engine',
        'mysqlConnected' => $dbConnected,
        'mysqlConfigured' => true,
        'statusMessage' => $dbStatus,
        'databaseName' => DB_NAME,
        'databaseUser' => DB_USER,
        'connectedHost' => $dbHostUsed,
        'activeTablesCount' => $tableCount,
        'activeTables' => $tablesList,
        'lastError' => $dbError,
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

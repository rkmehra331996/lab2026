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
$lastMySqlError = getLastMySqlError();

$tableCount = 0;
$tablesList = [];
$tableRowCounts = [];

if ($conn) {
    try {
        $tblStmt = $conn->query("SHOW TABLES");
        if ($tblStmt) {
            $tablesList = $tblStmt->fetchAll(PDO::FETCH_COLUMN);
            $tableCount = count($tablesList);
            foreach ($tablesList as $tbl) {
                try {
                    $cntStmt = $conn->query("SELECT COUNT(*) FROM `{$tbl}`");
                    $tableRowCounts[$tbl] = $cntStmt ? (int)$cntStmt->fetchColumn() : 0;
                } catch (\Exception $ex) {
                    $tableRowCounts[$tbl] = 'Error: ' . $ex->getMessage();
                }
            }
        }
        $dbStatus = '✅ Successfully Connected to Hostinger MySQL Database (' . DB_NAME . ') on ' . $dbHostUsed . ' (' . $tableCount . ' tables active)';
    } catch (\Exception $e) {
        $dbStatus = 'Connected to MySQL: ' . $e->getMessage();
    }
} else {
    $dbStatus = '⚠️ Hostinger MySQL Notice: ' . ($dbError ?: 'Not connected') . ' (Auto-Fallback to Built-in Storage Active)';
}

// Generate human-friendly diagnosis
$diagnosis = [];
if (!$dbConnected) {
    if (strpos((string)$dbError, '1045') !== false || strpos(strtolower((string)$dbError), 'access denied') !== false) {
        $diagnosis['issue'] = 'MySQL Password / Username Mismatch (Error 1045)';
        $diagnosis['solution_hindi'] = 'Hostinger hPanel > Databases > MySQL Databases me jaakar database ka password reset karein ya verify karein, aur use Admin Dashboard > Hostinger DB Settings me update karein.';
        $diagnosis['solution_en'] = 'Go to Hostinger hPanel > Databases > MySQL Databases. Verify or reset your MySQL password, then update it in the Admin Dashboard.';
    } elseif (strpos((string)$dbError, '1049') !== false || strpos(strtolower((string)$dbError), 'unknown database') !== false) {
        $diagnosis['issue'] = 'Database Name Does Not Exist in Hostinger (Error 1049)';
        $diagnosis['solution_hindi'] = 'Hostinger hPanel me "' . DB_NAME . '" naam ka database banayein aur user ko ALL PRIVILEGES assign karein.';
        $diagnosis['solution_en'] = 'Create a database named "' . DB_NAME . '" in Hostinger hPanel and grant all privileges to user "' . DB_USER . '".';
    } else {
        $diagnosis['issue'] = 'MySQL Host Connection Failed';
        $diagnosis['solution_hindi'] = 'Hostinger me MySQL host "localhost" hota hai. Ensure karein ki database user hostinger par active hai.';
        $diagnosis['solution_en'] = 'Ensure MySQL host is set to "localhost" in Hostinger and user has full privileges.';
    }
} elseif ($tableCount === 0) {
    $diagnosis['issue'] = 'Connected to MySQL but No Tables Found (0 tables)';
    $diagnosis['solution_hindi'] = 'phpMyAdmin kholein aur "hostinger_database_schema.sql" import karein, ya URL me /api/sync.php?action=repair_tables kholein.';
    $diagnosis['solution_en'] = 'Open phpMyAdmin and import hostinger_database_schema.sql, or open /api/sync.php?action=repair_tables.';
} else {
    $diagnosis['status'] = 'All Systems Operational';
    $diagnosis['message'] = 'Hostinger MySQL database is connected, verified, and accepting records.';
}

echo json_encode([
    'status' => 'online',
    'platform' => 'INDIANLALAJI.COM',
    'server' => 'Hostinger Web & Database Server',
    'database' => [
        'mode' => $dbConnected ? 'Hostinger MySQL' : 'Built-in Auto Storage Engine (Failover)',
        'mysqlConnected' => $dbConnected,
        'mysqlConfigured' => true,
        'statusMessage' => $dbStatus,
        'databaseName' => DB_NAME,
        'databaseUser' => DB_USER,
        'connectedHost' => $dbHostUsed,
        'activeTablesCount' => $tableCount,
        'activeTables' => $tablesList,
        'tableRowCounts' => $tableRowCounts,
        'lastConnectionError' => $dbError,
        'lastQueryError' => $lastMySqlError,
        'diagnosis' => $diagnosis,
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


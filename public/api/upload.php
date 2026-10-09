<?php
/**
 * INDIANLALAJI.COM - Hostinger Server Image & Asset Management Endpoint
 * Saves uploaded images (logos, DP, banners, signatures, attachments) directly on Hostinger server.
 * 
 * Features:
 * 1. Image Replacement: Automatically deletes the old image file from server when replaced.
 * 2. Image Deletion: Deletes both server file and database record when removed.
 * 3. Browser Cache-Busting: Returns versioned URL with ?v=timestamp to prevent stale image displays.
 * 4. Database Reference: Records image metadata in Hostinger MySQL `lab_images` table.
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

$uploadDir = UPLOADS_DIR;
if (!file_exists($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

// -----------------------------------------------------------------------------
// Helper: Delete old file safely from uploads directory
// -----------------------------------------------------------------------------
function safelyDeleteOldImageFile($fileUrlOrPath) {
    if (empty($fileUrlOrPath)) return false;
    $uploadDir = UPLOADS_DIR;
    $filename = basename(parse_url($fileUrlOrPath, PHP_URL_PATH));
    if ($filename && preg_match('/^[a-zA-Z0-9_\-\.]+$/', $filename)) {
        $targetPath = $uploadDir . '/' . $filename;
        if (file_exists($targetPath) && is_file($targetPath)) {
            @unlink($targetPath);
            return true;
        }
    }
    return false;
}

// -----------------------------------------------------------------------------
// Action: Delete Image Endpoint (POST or DELETE)
// -----------------------------------------------------------------------------
$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

$requestedAction = $_GET['action'] ?? ($payload['action'] ?? ($_POST['action'] ?? ''));

if ($requestedAction === 'delete_image' || $requestedAction === 'delete') {
    $targetUrl = $payload['url'] ?? ($payload['filePath'] ?? ($_POST['url'] ?? ''));
    if (!empty($targetUrl)) {
        safelyDeleteOldImageFile($targetUrl);

        // Delete reference from Hostinger MySQL if connected
        global $pdo;
        if ($pdo) {
            try {
                $filename = basename(parse_url($targetUrl, PHP_URL_PATH));
                $stmt = $pdo->prepare("DELETE FROM `lab_images` WHERE `filePath` LIKE :name OR `filePath` = :url");
                $stmt->execute([':name' => "%$filename%", ':url' => $targetUrl]);
            } catch (Exception $e) {}
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'Image deleted from Hostinger server and database',
            'url' => $targetUrl
        ]);
        exit();
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Missing target image URL']);
        exit();
    }
}

if ($method !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Only POST method is allowed']);
    exit();
}

$oldImageToReplace = $_POST['old_image'] ?? ($payload['old_image'] ?? ($payload['replace_url'] ?? ''));
$labId = $_POST['labId'] ?? ($payload['labId'] ?? 'all');
$imageType = $_POST['imageType'] ?? ($payload['imageType'] ?? 'other');

// 1. Handle Multipart Form-Data File Upload
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['file'];
    $originalName = $file['name'];
    $tmpName = $file['tmp_name'];
    $fileSize = $file['size'];

    // Validate size (max 20MB)
    if ($fileSize > 20 * 1024 * 1024) {
        echo json_encode(['status' => 'error', 'message' => 'File size exceeds 20MB limit']);
        exit();
    }

    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf'];

    if (!in_array($ext, $allowed)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid file extension. Allowed: jpg, jpeg, png, webp, svg, pdf']);
        exit();
    }

    // Replace old image if provided
    if (!empty($oldImageToReplace)) {
        safelyDeleteOldImageFile($oldImageToReplace);
    }

    $newFileName = 'img_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destination = $uploadDir . '/' . $newFileName;

    if (move_uploaded_file($tmpName, $destination)) {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
        $host = $_SERVER['HTTP_HOST'] ?? 'indianlalaji.com';
        $rawPath = '/uploads/' . $newFileName;
        // Anti-cache busting version tag
        $cacheBuster = '?v=' . time();
        $publicUrl = $rawPath . $cacheBuster;
        $fullUrl = $protocol . $host . $publicUrl;

        // Save reference in MySQL if connected
        global $pdo;
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("REPLACE INTO `lab_images` (`id`, `labId`, `imageType`, `filePath`, `originalName`, `fileSize`, `mimeType`) VALUES (:id, :labId, :imageType, :filePath, :originalName, :fileSize, :mimeType)");
                $stmt->execute([
                    ':id' => 'img_' . uniqid(),
                    ':labId' => $labId,
                    ':imageType' => in_array($imageType, ['logo', 'dp', 'banner', 'qr', 'signature', 'attachment']) ? $imageType : 'other',
                    ':filePath' => $rawPath,
                    ':originalName' => $originalName,
                    ':fileSize' => $fileSize,
                    ':mimeType' => 'image/' . $ext
                ]);
            } catch (Exception $e) {}
        }

        echo json_encode([
            'status' => 'success',
            'url' => $publicUrl,
            'rawUrl' => $rawPath,
            'fullUrl' => $fullUrl,
            'filename' => $newFileName,
            'size' => $fileSize
        ]);
        exit();
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file to uploads directory']);
        exit();
    }
}

// 2. Handle JSON Base64 Data URL Image Upload
if (is_array($payload) && !empty($payload['image'])) {
    $dataUrl = $payload['image'];
    $prefix = $payload['prefix'] ?? 'img';

    // Parse data URL: data:image/png;base64,iVBORw...
    if (preg_match('/^data:image\/(\w+);base64,/', $dataUrl, $type)) {
        $ext = strtolower($type[1]);
        if ($ext === 'jpeg') $ext = 'jpg';

        $data = substr($dataUrl, strpos($dataUrl, ',') + 1);
        $decoded = base64_decode($data);

        if ($decoded === false) {
            echo json_encode(['status' => 'error', 'message' => 'Base64 decode failed']);
            exit();
        }

        // Replace old image if provided
        if (!empty($oldImageToReplace)) {
            safelyDeleteOldImageFile($oldImageToReplace);
        }

        $cleanPrefix = preg_replace('/[^a-zA-Z0-9_-]/', '', $prefix);
        $newFileName = $cleanPrefix . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $destination = $uploadDir . '/' . $newFileName;

        if (@file_put_contents($destination, $decoded)) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
            $host = $_SERVER['HTTP_HOST'] ?? 'indianlalaji.com';
            $rawPath = '/uploads/' . $newFileName;
            // Anti-cache busting version tag
            $cacheBuster = '?v=' . time();
            $publicUrl = $rawPath . $cacheBuster;
            $fullUrl = $protocol . $host . $publicUrl;

            // Save reference in MySQL if connected
            global $pdo;
            if ($pdo) {
                try {
                    $stmt = $pdo->prepare("REPLACE INTO `lab_images` (`id`, `labId`, `imageType`, `filePath`, `originalName`, `fileSize`, `mimeType`) VALUES (:id, :labId, :imageType, :filePath, :originalName, :fileSize, :mimeType)");
                    $stmt->execute([
                        ':id' => 'img_' . uniqid(),
                        ':labId' => $labId,
                        ':imageType' => in_array($imageType, ['logo', 'dp', 'banner', 'qr', 'signature', 'attachment']) ? $imageType : 'other',
                        ':filePath' => $rawPath,
                        ':originalName' => $newFileName,
                        ':fileSize' => strlen($decoded),
                        ':mimeType' => 'image/' . $ext
                    ]);
                } catch (Exception $e) {}
            }

            echo json_encode([
                'status' => 'success',
                'url' => $publicUrl,
                'rawUrl' => $rawPath,
                'fullUrl' => $fullUrl,
                'filename' => $newFileName,
                'size' => strlen($decoded)
            ]);
            exit();
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to save decoded image file to uploads directory']);
            exit();
        }
    }
}

echo json_encode(['status' => 'error', 'message' => 'No valid file or base64 image provided']);

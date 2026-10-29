<?php
/* ============================================================
   GRC GamitKo
   items.php - the item reports (lost and found)

   Students report items they lost and turn in items they found.
   The office sees every report and changes its status.

   Actions: listFound, listLost, listAll, getItem, add,
            setStatus, delete
   Answers are JSON, for example { "ok": true, "items": [ ... ] }
   ============================================================ */

require_once __DIR__ . '/db.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'listFound') {
    listFoundItems();
} elseif ($action === 'listLost') {
    listLostReports();
} elseif ($action === 'listAll') {
    listAllItems();
} elseif ($action === 'getItem') {
    getItem();
} elseif ($action === 'add') {
    addItemReport();
} elseif ($action === 'setStatus') {
    setItemStatus();
} elseif ($action === 'delete') {
    deleteItemReport();
} else {
    sendError('Missing or invalid action.');
}


// All found items (student page and admin list).

function listFoundItems()
{
    global $pdo;

    $statement = $pdo->prepare(
        'SELECT
            i.id,
            i.type,
            i.name,
            i.category AS category,
            i.location,
            i.item_date AS itemDate,
            i.description,
            i.contact,
            i.status,
            u.name AS reporter,
            i.user_id AS reporterId,
            i.created_at AS dateAdded
         FROM items i
         LEFT JOIN users u ON u.id = i.user_id
         WHERE i.type = ?
         ORDER BY i.created_at DESC'
    );

    $statement->execute(['found']);
    $items = $statement->fetchAll(PDO::FETCH_ASSOC);

    addPhotoInfo($items);
    sendSuccess(['items' => $items]);
}
 

function listLostReports()
{
    global $pdo;

    $statement = $pdo->prepare(
        'SELECT
            i.id,
            i.type,
            i.name,
            i.category AS category,
            i.location,
            i.item_date AS itemDate,
            i.description,
            i.contact,
            i.status,
            u.name AS reporter,
            i.user_id AS reporterId,
            i.created_at AS dateAdded
         FROM items i
         LEFT JOIN users u ON u.id = i.user_id
         WHERE i.type = ?
         ORDER BY i.created_at DESC'
    );

    $statement->execute(['lost']);
    $items = $statement->fetchAll(PDO::FETCH_ASSOC);

    addPhotoInfo($items);
    sendSuccess(['items' => $items]);
}

// Every report, lost or found (used to count the reports of a student).


function listAllItems()
{
    global $pdo;

    $statement = $pdo->query(
        'SELECT
            i.id,
            i.type,
            i.name,
            i.category AS category,
            i.location,
            i.item_date AS itemDate,
            i.description,
            i.contact,
            i.status,
            u.name AS reporter,
            i.user_id AS reporterId,
            i.created_at AS dateAdded
         FROM items i
         LEFT JOIN users u ON u.id = i.user_id
         ORDER BY i.created_at DESC'
    );

    $items = $statement->fetchAll(PDO::FETCH_ASSOC);

    addPhotoInfo($items);
    sendSuccess(['items' => $items]);
}



// One single report (used when a student clicks "Claim this item").

function getItem()
{
    global $pdo;

    $itemId = $_POST['item_id'] ?? 0;

    $statement = $pdo->prepare(
        'SELECT
            i.id,
            i.type,
            i.name,
            i.category AS category,
            i.location,
            i.item_date AS itemDate,
            i.description,
            i.contact,
            i.status,
            u.name AS reporter,
            i.user_id AS reporterId,
            i.created_at AS dateAdded
         FROM items i
         LEFT JOIN users u ON u.id = i.user_id
         WHERE i.id = ?'
    );

    $statement->execute([$itemId]);
    $item = $statement->fetch(PDO::FETCH_ASSOC);

    if ($item === false) {
        sendError('This item does not exist.');
    }

    $items = [$item];
    addPhotoInfo($items);
    $item = $items[0];

    sendSuccess(['item' => $item]);
}



// Save a new report (a student lost an item or found one).

function addItemReport()
{
    global $pdo;

    $type = $_POST['type'] ?? 'lost';
    $name = trim($_POST['name'] ?? '');
    $category = trim($_POST['category'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $itemDate = $_POST['item_date'] ?? '';
    $description = trim($_POST['description'] ?? '');
    $contact = trim($_POST['contact'] ?? '');

    if (!in_array($type, ['lost', 'found'], true)) {
        sendError('Invalid report type.');
    }

    if (
        $name === '' ||
        $category === '' ||
        $location === '' ||
        $itemDate === '' ||
        $description === ''
    ) {
        sendError('Please complete all the required fields.');
    }

    $userId = $_SESSION['user_id'] ?? null;

    if ($userId === null) {
        http_response_code(401);
        sendError('You must be logged in.');
    }

    $statement = $pdo->prepare(
        'INSERT INTO items
            (type, name, category, location, item_date,
             description, contact, user_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $statement->execute([
        $type,
        $name,
        $category,
        $location,
        $itemDate,
        $description,
        $contact,
        $userId,
        'open'
    ]);

    $newId = $pdo->lastInsertId();

    if (
        isset($_FILES['photo']) &&
        $_FILES['photo']['error'] === UPLOAD_ERR_OK
    ) {
        savePhoto($newId, $_FILES['photo']);
    }

    sendSuccess(['id' => $newId]);
}



// Change the status of a report (office only).
function setItemStatus()
{
    global $pdo;

    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        sendError('You must log in first.');
    }

    // The account that asked must be an active admin.
    $statement = $pdo->prepare('SELECT role, status FROM users WHERE id = ?');
    $statement->execute([$_SESSION['user_id']]);
    $user = $statement->fetch();

    if ($user === false || $user['status'] !== 'active' || $user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only an active administrator can change item status.');
    }

    $itemId = filter_var($_POST['item_id'] ?? '', FILTER_VALIDATE_INT);
    $status = $_POST['status'] ?? '';

    if (!$itemId || !in_array($status, ['open', 'matched', 'returned'], true)) {
        http_response_code(400);
        sendError('Invalid item ID or status.');
    }

    $statement = $pdo->prepare('UPDATE items SET status = ? WHERE id = ?');
    $statement->execute([$status, $itemId]);

    sendSuccess([]);
}


// Delete a report the office no longer needs.
function deleteItemReport()
{
    global $pdo;

    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        sendError('You must log in first.');
    }

    // The account that asked must be an active admin.
    $statement = $pdo->prepare('SELECT role, status FROM users WHERE id = ?');
    $statement->execute([$_SESSION['user_id']]);
    $user = $statement->fetch();

    if ($user === false || $user['status'] !== 'active' || $user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only an active administrator can delete reports.');
    }

    $itemId = $_POST['item_id'] ?? 0;

    if (!$itemId) {
        http_response_code(400);
        sendError('Invalid item ID.');
    }

    // ON DELETE CASCADE removes the photos and claims too.
    $statement = $pdo->prepare('DELETE FROM items WHERE id = ?');
    $statement->execute([$itemId]);

    sendSuccess([]);
}


function addPhotoInfo(array &$items)
{
    global $pdo;

    $statement = $pdo->query('SELECT * FROM item_images');

    // Group the image paths by the item they belong to.
    $photos = [];
    foreach ($statement->fetchAll() as $row) {
        $photos[$row['item_id']][] = $row['image_path'];
    }

    foreach ($items as &$item) {
        $item['photo'] = '';
        if (isset($photos[$item['id']])) {
            $item['photo'] = implode(',', $photos[$item['id']]);
        }
    }
}


// Save an uploaded picture in the "uploads" folder.
function savePhoto($itemId, $file)
{
    global $pdo;

    $folder = __DIR__ . '/../uploads';

    // Create the uploads folder if it is not there yet.
    if (!is_dir($folder) && !mkdir($folder)) {
        return;
    }

    // Give the file a name that is still unique.
    $fileName = uniqid('photo_') . '.' . pathinfo($file['name'], PATHINFO_EXTENSION);

    // Move the uploaded picture into the uploads folder.
    move_uploaded_file($file['tmp_name'], $folder . '/' . $fileName);

    // Save the full relative path in the database so it matches
    // what addPhotoInfo() returns and what the <img> tags expect.
    $relativePath = 'uploads/' . $fileName;

    $statement = $pdo->prepare(
        'INSERT INTO item_images (item_id, image_path) VALUES (?, ?)'
    );
    $statement->execute([$itemId, $relativePath]);
}


// Send a successful answer as JSON.
function sendSuccess($data)
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['ok' => true], $data));
    exit;
}


// Send an error message as JSON.
function sendError($message)
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

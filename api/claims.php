<?php
/* ============================================================
   GRC GamitKo
   claims.php - the claim requests

   A student sends a claim saying a found item belongs to them,
   and the office approves or rejects it.

   Actions: myClaims, allClaims, send, decide
   Answers are JSON, for example { "ok": true, "claims": [ ... ] }
   ============================================================ */

require_once __DIR__ . '/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'myClaims') {
    myClaims();
} elseif ($action === 'allClaims') {
    allClaims();
} elseif ($action === 'send') {
    sendClaim();
} elseif ($action === 'decide') {
    decideClaim();
} else {
    sendError('Missing or invalid action.');
}


// The claims of the logged-in student (student page).
function myClaims()
{
    global $pdo;

    $userId = $_SESSION['user_id'] ?? null;
    if ($userId === null) {
        http_response_code(401);
        sendError('You must be logged in.');
    }

    $statement = $pdo->prepare(
        'SELECT c.id, c.item_id AS itemId, c.user_id AS studentId,
                u.name AS studentName, c.message, c.status, c.office_note AS note,
                c.created_at AS dateSent, i.name AS itemName
         FROM claims c
         LEFT JOIN users u ON u.id = c.user_id
         LEFT JOIN items i ON i.id = c.item_id
         WHERE c.user_id = ?
         ORDER BY c.created_at DESC'
    );
    $statement->execute([$userId]);

    sendSuccess(['claims' => $statement->fetchAll()]);
}

// Every claim, for the admin page.

function allClaims()
{
    global $pdo;

    $user = getCurrentUser();

    if ($user === null || $user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only the office can view all claims.');
        return;
    }

    $statement = $pdo->query(
        'SELECT
            c.id,
            c.item_id AS itemId,
            c.user_id AS studentId,
            u.name AS studentName,
            c.message,
            c.status,
            c.office_note AS note,
            c.created_at AS dateSent,
            i.name AS itemName
        FROM claims c
        LEFT JOIN users u ON u.id = c.user_id
        LEFT JOIN items i ON i.id = c.item_id
        ORDER BY c.created_at DESC'
    );

    sendSuccess([
        'claims' => $statement->fetchAll(PDO::FETCH_ASSOC)
    ]);
}

// Save a new claim from a student.
function sendClaim()
{
    global $pdo;

    $userId = $_SESSION['user_id'] ?? null;
    if ($userId === null) {
        http_response_code(401);
        sendError('You must be logged in.');
    }

    $itemId = $_POST['item_id'] ?? 0;
    $message = $_POST['message'] ?? '';

    if (!$itemId || $message === '') {
        sendError('Please complete all the required fields.');
    }

    // The item must exist.
    $statement = $pdo->prepare('SELECT id FROM items WHERE id = ?');
    $statement->execute([$itemId]);
    if ($statement->fetch() === false) {
        sendError('This item does not exist.');
    }

    // No second pending claim for the same item.
    $statement = $pdo->prepare(
        'SELECT status FROM claims WHERE item_id = ? AND user_id = ?'
    );
    $statement->execute([$itemId, $userId]);
    $oldClaim = $statement->fetch();
    if ($oldClaim !== false && $oldClaim['status'] === 'pending') {
        sendError('You already sent a claim for this item.');
    }

    $statement = $pdo->prepare(
        'INSERT INTO claims (item_id, user_id, message, status)
         VALUES (?, ?, ?, ?)'
    );
    $statement->execute([$itemId, $userId, $message, 'pending']);

    sendSuccess([]);
}


// The office approves or rejects a claim.
function decideClaim()
{
    global $pdo;

    $user = getCurrentUser();
    if ($user === null || $user['role'] !== 'admin') {
        sendError('Only the office can decide about claims.');
    }

    $claimId = $_POST['claim_id'] ?? 0;
    $decision = $_POST['decision'] ?? '';
    $note = $_POST['note'] ?? '';

    if ($decision !== 'approved' && $decision !== 'rejected') {
        sendError('This is not a valid decision.');
    }

    $statement = $pdo->prepare('SELECT * FROM claims WHERE id = ?');
    $statement->execute([$claimId]);
    $claim = $statement->fetch();
    if ($claim === false) {
        sendError('This claim does not exist.');
    }

    $statement = $pdo->prepare(
        'UPDATE claims SET status = ?, office_note = ? WHERE id = ?'
    );
    $statement->execute([$decision, $note, $claimId]);

    // An approved claim means the item was handed back.
    if ($decision === 'approved') {
        $statement = $pdo->prepare('UPDATE items SET status = ? WHERE id = ?');
        $statement->execute(['returned', $claim['item_id']]);
    }

    sendSuccess([]);
}


// The account that is logged in, or null if there is none.
function getCurrentUser()
{
    global $pdo;

    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        return null;
    }

    $statement = $pdo->prepare(
        'SELECT id, name, email, role, status FROM users WHERE id = ?'
    );
    $statement->execute([$userId]);
    $user = $statement->fetch();

    if ($user === false || $user['status'] !== 'active') {
        return null;
    }

    return $user;
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

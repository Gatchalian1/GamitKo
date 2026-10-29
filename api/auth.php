<?php
/* ============================================================
   GRC GamitKo
   auth.php - login, register, logout and "who am I"

   Actions: login, register, logout, me
   Answers are JSON, for example { "ok": true, "user": { ... } }
   ============================================================ */

require_once __DIR__ . '/db.php';

// We need the session before we can read or change it.
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'login') {
    loginUser();
} elseif ($action === 'register') {
    registerUser();
} elseif ($action === 'logout') {
    logoutUser();
} elseif ($action === 'me') {
    getCurrentUser();
} else {
    sendError('Missing or invalid action.');
}


// Log in an existing user.
function loginUser()
{
    global $pdo;

    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        sendError('Please type your email and password.');
    }

    $statement = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $statement->execute([$email]);
    $user = $statement->fetch();

    if ($user === false || !password_verify($password, $user['password_hash'])) {
        sendError('Incorrect email or password.');
    }

    if ($user['status'] !== 'active') {
        sendError('This account is deactivated. Please visit the OSA office.');
    }

    // Give the browser a new session id after a successful login.
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];

    sendSuccess([
        'user' => [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
        ],
    ]);
}


// Register a new student account.
function registerUser()
{
    global $pdo;

    $name = trim($_POST['name'] ?? '');
    $studentId = trim($_POST['student_id'] ?? '');
    $course = trim($_POST['course'] ?? '');
    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';

    if ($name === '' || $studentId === '' || $course === ''
        || $email === '' || $password === '') {
        sendError('Please fill up all the fields.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('Please enter a valid email address.');
    }

    if (strlen($password) < 5) {
        sendError('Password must be at least 5 characters.');
    }

        $statement = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $statement->execute([$email]);

    if ($statement->fetch() !== false) {
        sendError('That email is already registered.');
    }

    $statement = $pdo->prepare('SELECT id FROM users WHERE student_id = ?');
    $statement->execute([$studentId]);

    if ($statement->fetch() !== false) {
        sendError('That Student ID is already registered.');
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $statement = $pdo->prepare(
        'INSERT INTO users
         (name, email, password_hash, role, student_id, course, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $statement->execute([
        $name,
        $email,
        $passwordHash,
        'student',
        $studentId,
        $course,
        'active',
    ]);

    $userId = (int) $pdo->lastInsertId();

    // Log the new student in right away.
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;

    sendSuccess([
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => 'student',
        ],
    ]);
}


// Return the account of the person using the site right now.
function getCurrentUser()
{
    global $pdo;

    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        sendError('You are not logged in.');
    }

    $statement = $pdo->prepare(
        'SELECT id, name, email, role, status FROM users WHERE id = ?'
    );
    $statement->execute([$_SESSION['user_id']]);
    $user = $statement->fetch();

    if ($user === false || $user['status'] !== 'active') {
        $_SESSION = [];
        session_destroy();

        http_response_code(401);
        sendError('Your session is no longer valid.');
    }

    sendSuccess([
        'user' => [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
        ],
    ]);
}


// Log out the current user.
function logoutUser()
{
    $_SESSION = [];
    session_destroy();

    sendSuccess([]);
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

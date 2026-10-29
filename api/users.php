<?php
/* ============================================================
   GRC GamitKo
   users.php - the student accounts (admin page)

   Actions: listStudents, toggleStatus, updateStudent
   Answers are JSON, for example { "ok": true, "students": [ ... ] }
   ============================================================ */

require_once __DIR__ . '/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'listStudents') {
    listStudents();
} elseif ($action === 'toggleStatus') {
    toggleStudentStatus();
} elseif ($action === 'updateStudent') {
    updateStudent();
} else {
    sendError('Missing or invalid action.');
}


// Every student account (admin page).
function listStudents()
{
    global $pdo;

    $user = getCurrentUser();
    if ($user === null || $user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only the office can view students.');
    }

    $statement = $pdo->prepare(
        'SELECT id, name, student_id AS studentId, course, email, status
         FROM users
         WHERE role = ?
         ORDER BY id'
    );
    $statement->execute(['student']);

    sendSuccess(['students' => $statement->fetchAll()]);
}


// Turn a student account on or off.
function toggleStudentStatus()
{
    global $pdo;

    $user = getCurrentUser();
    if ($user === null || $user['role'] !== 'admin') {
        sendError('Only the office can change accounts.');
    }

    $userId = $_POST['user_id'] ?? 0;
    $status = $_POST['status'] ?? 'active';

    $statement = $pdo->prepare('UPDATE users SET status = ? WHERE id = ?');
    $statement->execute([$status, $userId]);

    sendSuccess([]);
}


// Update an existing student's account information.
function updateStudent()
{
    global $pdo;

    $user = getCurrentUser();
    if ($user === null || $user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only the office can update student accounts.');
    }

    $userId = $_POST['user_id'] ?? 0;
    $name = trim($_POST['name'] ?? '');
    $studentId = trim($_POST['student_id'] ?? '');
    $course = trim($_POST['course'] ?? '');
    $email = strtolower(trim($_POST['email'] ?? ''));

    if (!$userId || $name === '' || $studentId === '' || $course === '' || $email === '') {
        sendError('Please fill up all the required fields.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('Please enter a valid email address.');
    }

    // Check if the email is already used by another user account
    $check = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
    $check->execute([$email, $userId]);
    if ($check->fetch() !== false) {
        sendError('That email is already registered to another account.');
    }

    $statement = $pdo->prepare(
        'UPDATE users 
         SET name = ?, student_id = ?, course = ?, email = ? 
         WHERE id = ? AND role = ?'
    );
    $statement->execute([$name, $studentId, $course, $email, $userId, 'student']);

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
<?php
/* ============================================================
   GRC GamitKo
   db.php - the database connection

   Every PHP file in this folder includes this file so they
   all share the same PDO connection.
   ============================================================ */

// Database settings (XAMPP defaults).
define('DB_NAME', 'if0_43302285_db_gamitko');
define('DB_USER', 'if0_43302285');
define('DB_PASS', 'O0vjmiEXgcTs');

// Open the connection. If it fails, PHP stops and shows the
// error, because we turned on ERRMODE_EXCEPTION below.
$pdo = new PDO(
    'mysql:host=sql204.infinityfree.com;dbname=' . DB_NAME . ';charset=utf8mb4',
    DB_USER,
    DB_PASS,
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
);

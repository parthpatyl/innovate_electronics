<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/NewsletterService.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->connect();

$newsletterService = new NewsletterService($db);

$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $result = $newsletterService->subscribe($data->email);
    echo json_encode($result);
} else {
    echo json_encode(['error' => 'Invalid request method']);
}
<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/ChatbotService.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->connect();

$chatbotService = new ChatbotService($db);

$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = $chatbotService->handleMessage($data->message);
    echo json_encode(['response' => $response]);
} else {
    echo json_encode(['error' => 'Invalid request method']);
}
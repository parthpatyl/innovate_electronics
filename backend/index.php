<?php
require_once __DIR__ . '/config/bootstrap.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$request = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Simple router
switch ($request) {
    case '/':
    case '':
        require __DIR__ . '/frontend/index.html';
        break;
    case '/api/chat':
        require __DIR__ . '/api/chatbot.php';
        break;
    case '/api/newsletter':
        require __DIR__ . '/api/newsletter.php';
        break;
    case '/api/cms':
        require __DIR__ . '/api/cms.php';
        break;
    // Add more routes as needed
    default:
        // Check if it's a static file request
        if (preg_match('/\.(?:html|css|js|png|jpg|jpeg|gif)$/', $request)) {
            return false; // Let the server handle static files
        }

        http_response_code(404);
        echo json_encode(['message' => 'Not Found']);
        break;
}
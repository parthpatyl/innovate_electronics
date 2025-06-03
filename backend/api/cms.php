<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/CmsService.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->connect();

$cmsService = new CmsService($db);

$data = json_decode(file_get_contents("php://input"));

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $content = $cmsService->getContent($_GET['page']);
        echo json_encode($content);
        break;
    case 'POST':
        $result = $cmsService->updateContent($data->page, $data->content);
        echo json_encode($result);
        break;
    default:
        echo json_encode(['error' => 'Invalid request method']);
        break;
}
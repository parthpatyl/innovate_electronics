<?php
class ChatbotService {
    private $conn;
    private $table = 'chat_logs';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function handleMessage($message) {
        // Basic response logic - can integrate with Dialogflow, IBM Watson, or custom NLP
        $message = strtolower(trim($message));

        // Check for greetings
        if (preg_match('/hello|hi|hey/', $message)) {
            return "Hello! How can I help you today?";
        }

        // Check for goodbye
        if (preg_match('/bye|goodbye/', $message)) {
            return "Goodbye! Have a great day!";
        }

        // Check for specific queries
        if (preg_match('/contact|email|phone/', $message)) {
            return "You can contact us at support@example.com or call +1-234-567-8900.";
        }

        // Log the chat
        $this->logChat($message);

        // Default response
        return "I'm not sure I understand. Can you rephrase your question?";
    }

    private function logChat($message) {
        $query = "INSERT INTO " . $this->table . "
                  SET message = :message, response = :response, created_at = NOW()";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':message', $message);
        $response = $this->handleMessage($message);
        $stmt->bindParam(':response', $response);

        $stmt->execute();
    }
}
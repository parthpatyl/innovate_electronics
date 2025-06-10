<?php
class WhatsAppService {
    private $apiUrl = 'https://api.whatsapp.com/send';
    private $phoneNumber = 'YOUR_BUSINESS_NUMBER';

    public function generateLink($message = '') {
        $encodedMessage = urlencode($message);
        return "{$this->apiUrl}?phone={$this->phoneNumber}&text={$encodedMessage}";
    }

    public function sendMessage($to, $message) {
        // Using Twilio WhatsApp API or similar
        $client = new \Twilio\Rest\Client(ACCOUNT_SID, AUTH_TOKEN);

        return $client->messages->create(
            "whatsapp:$to",
            [
                'from' => "whatsapp:{$this->phoneNumber}",
                'body' => $message
            ]
        );
    }
}

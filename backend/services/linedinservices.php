<?php
class LinkedInService {
    private $clientId = 'YOUR_CLIENT_ID';
    private $clientSecret = 'YOUR_CLIENT_SECRET';
    private $redirectUri = 'YOUR_REDIRECT_URI';
    private $apiUrl = 'https://api.linkedin.com/v2';

    public function getAuthUrl() {
        $state = bin2hex(random_bytes(16));
        $_SESSION['linkedin_state'] = $state;

        $scopes = urlencode('r_liteprofile r_emailaddress w_member_social');

        return "https://www.linkedin.com/oauth/v2/authorization?" .
            "response_type=code&client_id={$this->clientId}&" .
            "redirect_uri={$this->redirectUri}&state={$state}&scope={$scopes}";
    }

    public function handleCallback($code, $state) {
        if ($state !== $_SESSION['linkedin_state']) {
            throw new Exception('Invalid state');
        }

        $token = $this->getAccessToken($code);
        $profile = $this->getUserProfile($token);

        return $profile;
    }

    private function getAccessToken($code) {
        $params = [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->redirectUri,
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret
        ];

        $response = file_get_contents('https://www.linkedin.com/oauth/v2/accessToken?' . http_build_query($params));
        $data = json_decode($response, true);

        return $data['access_token'];
    }

    private function getUserProfile($token) {
        $context = stream_context_create([
            'http' => [
                'header' => "Authorization: Bearer {$token}\r\n"
            ]
        ]);

        $response = file_get_contents("{$this->apiUrl}/me", false, $context);
        return json_decode($response, true);
    }
}
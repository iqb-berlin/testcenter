<?php
declare(strict_types=1);
// TODO unit-test
// TODO find a way to integrate this in e2e-tests

class BroadcastService {

    private static $url = '';


    static function setup(string $broadcastServiceUri) {

        self::$url = $broadcastServiceUri;
    }


    static function getUrl() {

        return BroadcastService::$url;
    }
    
    
    static function sessionChange(SessionChangeMessage $sessionChange): ?string {

        return BroadcastService::push('push/session-change', json_encode($sessionChange));
    }
    

    static function push(string $endpoint, string $message, string $verb = "POST"): ?string {

        if (!BroadcastService::$url) {

            return null;
        }

        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => BroadcastService::$url . '/' . $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => $verb,
            CURLOPT_POSTFIELDS => $message,
            CURLOPT_FAILONERROR => true,
            CURLOPT_HTTPHEADER => [
                "Content-Type: application/json"
            ],
        ]);

        $curlResponse = curl_exec($curl);

        if (curl_error($curl)) {

            $errorCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            error_log("CURL Error ($errorCode): " . print_r($curlResponse, true));
            return null;
        }

        return $curlResponse;
    }
}

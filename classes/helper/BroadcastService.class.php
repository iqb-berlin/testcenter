<?php
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
    
    
    static function sessionChange(SessionChangeMessage $sessionChange): bool {

        return BroadcastService::push('session-change', json_encode($sessionChange));
    }
    

    static function push(string $messageType, string $message,
                         string $verb = "POST", string $contentType = "application/json"): bool {

        if (!BroadcastService::$url) {

            return false;
        }

        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => BroadcastService::$url . "/push/{$messageType}",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => $verb,
            CURLOPT_POSTFIELDS => $message,
            CURLOPT_HTTPHEADER => [
                "Content-Type: $contentType"
            ],
        ]);

        $curlResponse = curl_exec($curl);

        if (curl_error($curl)) {
            error_log("CURl ERROR" . print_r($curlResponse, true));
            return false;
        }

        return true;
    }
}

<?php


class BroadcastService {

    private static $url = '';

    static function setup(SystemConfig $config) {

        self::$url = $config->broadcastServiceUri;
    }

    static function push(StatusBroadcast $status) {

        if (!BroadcastService::$url) {
            return;
        }

        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => BroadcastService::$url . "/call",
            CURLOPT_RETURNTRANSFER => true,
//            CURLOPT_ENCODING => "",
//            CURLOPT_MAXREDIRS => 10,
//            CURLOPT_TIMEOUT => 0,
//            CURLOPT_FOLLOWLOCATION => true,
//            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => json_encode($status),
            CURLOPT_HTTPHEADER => [
                "Content-Type: application/json"
            ],
        ]);

        $response = curl_exec($curl);

        if (curl_error($curl)) {
            error_log("CURl ERROR" . print_r($response, true));
        }
    }
}

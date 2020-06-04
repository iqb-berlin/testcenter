<?php
// TODO unit-test
// TODO find a way to integrate this in e2e-tests

class BroadcastService {

    private static $url = '';


    static function setup(string $broadcastServiceUri) {

        self::$url = $broadcastServiceUri;
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

        $curlResponse = curl_exec($curl);

        if (curl_error($curl)) {
            error_log("CURl ERROR" . print_r($curlResponse, true));
        }
    }
}

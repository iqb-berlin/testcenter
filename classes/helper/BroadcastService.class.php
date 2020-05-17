<?php


class BroadcastService {

    static function cast(int $person, int $test, string $status,
                         ?string $personName = null, ?string $testName = null) {

        $status = [
            "person" => $person,
            "test" => $test,
            "status" => $status
        ];

        if ($personName) {
            $status['personName'] = $personName;
        }

        if ($testName) {
            $status['testName'] = $testName;
        }

        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => "http://localhost:3000/call",
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
        error_log($response);
    }
}

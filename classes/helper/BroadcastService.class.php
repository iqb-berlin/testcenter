<?php
/** @noinspection PhpUnhandledExceptionInspection */
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


    static function getVersionExpected(): string {

        $composerFile = file_get_contents(ROOT_DIR . '/composer.json');
        $composerData = JSON::decode($composerFile, true);
        if (!isset($composerData['extra']) or !isset($composerData['extra']['broadcastingServiceVersionExpected'])) {

            throw new Exception("BroadcastingService Version Expected not set.");
        }
        return $composerData['extra']['broadcastingServiceVersionExpected'];
    }


    static function getStatus(): array {

        $status = [];

        if (!BroadcastService::$url) {

            return $status;
        }

        $version = BroadcastService::push('version', '', 'GET');
        $status['versionExpected'] = BroadcastService::getVersionExpected();

        if ($version === null) {

            $status['status'] = 'offline';
            return $status;
        }

        $status['status'] = 'online';
        $status['version'] = $version;

        if (version_compare($version, $status['versionExpected']) < 0) {

            throw new Exception("BroadcastingService is set up and online but version `$version` is too old; 
                `{$status['versionExpected']}` expected");
        }

        if (explode('.', $version)[0] >  explode('.', $status['versionExpected'])[0]) {

            throw new Exception("BroadcastingService is set up and online but version `$version` is too new; 
                `{$status['versionExpected']}` expected");
        }

        return $status;
    }


    static function registerChannel(string $channelName, array $data): ?string {

        $bsToken = md5((string) rand(0, 99999999));
        $data['token'] = $bsToken;
        $broadcastServiceOnline = BroadcastService::push("test/register", json_encode($data)) !== null;
        $url = str_replace(['http://', 'https://'], ['ws://', 'wss://'], BroadcastService::getUrl()) . '/' . $bsToken;
        return $broadcastServiceOnline ? $url : null;
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
            CURLOPT_FAILONERROR, false, // allows to read body on error
            CURLOPT_HTTPHEADER => [
                "Content-Type: application/json"
            ],
        ]);

        $curlResponse = curl_exec($curl);
        $errorCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

        if (($errorCode === 0) or ($curlResponse === false)) {
            error_log("BroadcastingService responds Error on `[$verb] $endpoint`: not available");
            return null;
        }

        if ($errorCode >= 400) {
            error_log("BroadcastingService responds Error on `[$verb] $endpoint`: [$errorCode] $curlResponse");
            return null;
        }

        return $curlResponse;
    }
}

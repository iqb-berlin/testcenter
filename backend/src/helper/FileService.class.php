<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-test
// TODO find a way to integrate this in e2e-tests

class FileService {
  static function getStatus(): string {
    if (!SystemConfig::$fileService_host) {
      return 'off';
    }

    $uri = 'http://' . SystemConfig::$fileService_host . 'health';

    $curl = curl_init();
    curl_setopt_array($curl, [
      CURLOPT_URL => $uri,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 5,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_FAILONERROR => false, // allows to read body on error
      CURLOPT_HTTPHEADER => [
        "Content-Type: text/plain"
      ],
    ]);

    $curlResponse = curl_exec($curl);
    $errorCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    if (($errorCode === 0) or ($curlResponse === false)) {

      error_log("FilesService responds Error on `[GET] $uri`: not available");
      return 'unreachable';
    }

    if ($errorCode >= 400) {
      error_log("BroadcastingService responds Error on `[GET] $uri`: [$errorCode] $curlResponse");
      return 'unreachable';
    }

    return 'on';
  }

  public static function getUri(): string {
    if (!SystemConfig::$fileService_host) {
      return '';
    }
    return 'http://' . SystemConfig::$fileService_host;
  }
}

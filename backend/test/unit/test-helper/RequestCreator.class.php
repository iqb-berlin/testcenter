<?php

use Slim\Psr7\Environment;
use Slim\Psr7\Factory\UriFactory;
use Slim\Psr7\Headers;
use Slim\Psr7\Request;
use Slim\Psr7\Stream;
use Slim\Http\ServerRequest;

class RequestCreator {
  static function create(
    string $method,
    string $uri,
    string $body = '',
    array  $environment = [],
    array  $cookies = [],
    array  $serverParams = []
  ): ServerRequest {
    $uriFactory = new UriFactory();
    return new ServerRequest(
      new Request(
        $method,
        $uriFactory->createUri($uri),
        new Headers([], Environment::mock($environment)),
        $cookies,
        $serverParams,
        new Stream(fopen(sprintf('data://text/plain,%s', $body), 'r'))
      )
    );
  }

  static function createFileUpload(
    string $method,
    string $uri,
    string $fieldName,
    array  $parts, // filename -> fielContent
    array  $environment = [],
    array  $cookies = [],
    array  $serverParams = []
  ): ServerRequest {
    $environment = array_merge(
      $environment,
      [
        'HTTP_CONTENT_TYPE' => 'multipart/form-data; boundary=---foo'
      ]
    );

    $body = '';

    foreach ($parts as $fileName => $fileContent) {
      $body .= "---foo\nContent-Disposition: form-data; name=\"$fieldName\"; filename=\"$fileName\"\n$fileContent";
    }

    return RequestCreator::create($method, $uri, $body, $environment, $cookies, $serverParams);
  }
}
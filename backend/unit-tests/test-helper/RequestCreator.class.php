<?php

use Slim\Http\Environment;
use Slim\Http\Headers;
use Slim\Http\Request;
use Slim\Http\Stream;
use Slim\Http\Uri;

class RequestCreator {
    static function create(
        string $method,
        string $uri,
        string $body = '',
        array $environment = [],
        array $cookies = [],
        array $serverParams = []
    ):Request {
        return new Request(
            $method,
            Uri::createFromString($uri),
            Headers::createFromEnvironment(Environment::mock($environment)),
            $cookies,
            $serverParams,
            new Stream(fopen(sprintf('data://text/plain,%s', $body), 'r'))
        );
    }

    static function createFileUpload(
        string $method,
        string $uri,
        string $fieldName,
        array $parts, // filename -> fielContent
        array $environment = [],
        array $cookies = [],
        array $serverParams = []
    ):Request {

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
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
    ) {
        return new Request(
            $method,
            Uri::createFromString($uri),
            Headers::createFromEnvironment(Environment::mock($environment)),
            $cookies,
            $serverParams,
            new Stream(fopen(sprintf('data://text/plain,%s', $body), 'r'))
        );
    }
}
<?php

use Slim\App;
use Slim\Exception\HttpBadRequestException;
use Slim\Http\Request;
use Slim\Http\Response;





$app->group('/speed-test', function(App $app) { // TODO write spec

    $app->get('/random-package/{size}', function(Request $request, Response $response) {

        $size = (int) $request->getAttribute('size');

        apache_setenv('no-gzip', '1');

        if (($size > 8388608 * 8) or ($size < 16)) {

            throw new HttpBadRequestException($request, "Unsupported test size ({$size})");
        }

        $package = '';

        $allowedChars = "ABCDEFGHIJKLOMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz0123456789+/";
        while ($size-- > 1) {
            $package .= substr($allowedChars, rand(0, strlen($allowedChars) - 1), 1);
        }
        $package .= '=';

        $response->getBody()->write($package);
        return $response
            ->withHeader('Content-Transfer-Encoding','binary')
            ->withHeader('Content-Type', 'text/plain');

    });


    $app->post('/random-package', function(/** @noinspection PhpUnusedParameterInspection */ Request $request, Response $response) { // TODO write spec

        return $response->withJson([
            'requestTime' => $_SERVER['REQUEST_TIME_FLOAT'],
            'packageReceivedSize' => $_SERVER['CONTENT_LENGTH']
        ]);
    });
});

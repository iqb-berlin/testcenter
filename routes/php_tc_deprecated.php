<?php

use Slim\Http\Response;
use Slim\Http\Request;
use Slim\Exception\HttpException;

$app->any('/php_tc/{tried:.*}', function (Request $request, Response $response) {

    throw new HttpException($request, "Routes of the TC (not Admin) are not available in this version", 403);
});


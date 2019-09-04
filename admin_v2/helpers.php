<?php

use Slim\Http\Request as Request;
use Slim\Http\Response;

/**
 * a set of recurrent helper functions
 */


function jsonencode($obj) {
    return json_encode($obj, JSON_UNESCAPED_UNICODE);
}



/**
 * Provisional: a generic exeception handler. will be removed, slim app is defined globally once
 * renderer are used.
 * TODO make this unnecessary
 *
 * @param Request $request
 * @param Response $response
 * @param Throwable $ex
 * @return Response
 */
function errorOut(Slim\Http\Request $request, Slim\Http\Response $response, Throwable $ex) : Slim\Http\Response {

    error_log("[Error: " . $ex->getCode() . "]". $ex->getMessage());
    error_log("[Error: " . $ex->getCode() . "]".  $ex->getFile() . ' | line ' . $ex->getLine());

    if (!is_a($ex, "Slim\Exception\HttpException")) {
        $ex = new \Slim\Exception\HttpException($request, $ex->getMessage(), 500, $ex);
    }

    error_log("[Error: " . $ex->getCode() . "]". $ex->getTitle());
    error_log("[Error: " . $ex->getCode() . "]". $ex->getDescription());

    return $response
        ->withStatus($ex->getCode())
        ->withHeader('Content-Type', 'text/html')
        ->write($ex->getMessage() ? $ex->getMessage() : $ex->getDescription());
}

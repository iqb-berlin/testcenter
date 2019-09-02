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
 * this will be deprecated once DBConnection gets refactored itself and will throw exceptions by itself and also will
 * have a getInstance function or such.
 * TODO make this unnecessary
 *
 * @return DBConnectionSuperadmin
 * @throws Exception
 */
function getDBConnectionSuperAdmin() : DBConnectionSuperadmin  {

    $myDBConnection = new DBConnectionSuperadmin();
    if ($myDBConnection->isError()) {
        throw new Exception($myDBConnection->errorMsg);
    }
    return $myDBConnection;
}


/**
 * Provisional: a generic exeception handler. will be removed, when global exceptiosn case takes place / slim 4 error
 * renderer are used.
 * TODO make this unnecessary
 *
 * @param Request $request
 * @param Response $response
 * @param Exception $ex
 * @return Response
 */
function errorOut(Slim\Http\Request $request, Slim\Http\Response $response, Exception $ex) : Slim\Http\Response {

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
        ->write("[Error]\t" . $ex->getDescription());
}

<?php

use Slim\Http\Request;
use Slim\Http\Response;

class ErrorHandler {
    public function __invoke(Request $request, Response $response, Exception $exception) {

        error_log("[Error: " . $exception->getCode() . "]" . $exception->getMessage());
        error_log("[Error: " . $exception->getCode() . "]" . $exception->getFile() . ' | line ' . $exception->getLine());

        if (!is_a($exception, "Slim\Exception\HttpException")) {
            $exception = new \Slim\Exception\HttpException($request, $exception->getMessage(), 500, $exception);
        }

        error_log("[Error: " . $exception->getCode() . "]" . $exception->getTitle());
        error_log("[Error: " . $exception->getCode() . "]" . $exception->getDescription());

        return $response
            ->withStatus($exception->getCode())
            ->withHeader('Content-Type', 'text/html')
            ->write($exception->getMessage() ? $exception->getMessage() : $exception->getDescription());
    }
}

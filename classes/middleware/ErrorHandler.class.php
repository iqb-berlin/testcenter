<?php

use Slim\Http\Request;
use Slim\Http\Response;

class ErrorHandler {
    public function __invoke(Request $request, Response $response, Throwable $throwable) {

        $errorMessage = $throwable->getMessage();
        $errorPlace = $throwable->getFile() . ' | line ' . $throwable->getLine();
        $trace = $throwable->getTraceAsString();

        if (!is_a($throwable, "Slim\Exception\HttpException")) {
            if (is_a($throwable, 'HttpError')) {
                $throwable = new \Slim\Exception\HttpException($request, $throwable->getMessage(), $throwable->getCode(), $throwable);
            } else {
                $throwable = new \Slim\Exception\HttpException($request, $throwable->getMessage(), 500, $throwable);
            }
        }

        $log = array_merge(
            array($throwable->getTitle(), $throwable->getDescription(), $errorMessage, $errorPlace),
            explode("\n", $trace)
        );

        foreach ($log as $errorText) {
            if ($errorText) {
                error_log("[Error: " . $throwable->getCode() . "] " . $errorText);
            }
        }

        return $response
            ->withStatus($throwable->getCode())
            ->withHeader('Content-Type', 'text/html')
            ->write($throwable->getMessage() ? $throwable->getMessage() : $throwable->getDescription());
    }
}

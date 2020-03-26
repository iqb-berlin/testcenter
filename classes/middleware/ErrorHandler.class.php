<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

use Slim\Http\Request;
use Slim\Http\Response;

class ErrorHandler {


    static function logException(Throwable $throwable, bool $logTrace = false): string {

        $errorUniqueId = uniqid('error-', true);
        $code = ErrorHandler::getHTTPSaveExceptionCode($throwable);

        $log = [];

        $log[] = $errorUniqueId;

        if (method_exists($throwable, 'getTitle')) {
            $log[] =  $throwable->getTitle();
        }

        if (method_exists($throwable, 'getDescription')) {
            $log[] =  $throwable->getDescription();
        }

        $log[] = $throwable->getMessage();

        if ($logTrace) {
            $trace = explode("\n", $throwable->getTraceAsString());
            $log = array_merge($log, $trace);
        } else {
            $log[] = $throwable->getFile() . ' | line ' . $throwable->getLine();
        }

        foreach ($log as $logLine) {
            if ($logLine) {
                error_log("[Error: $code] $logLine");
            }
        }

        return $errorUniqueId;
    }


    static function getHTTPSaveExceptionCode(Throwable $throwable): int {

        if (is_a($throwable, "Slim\Exception\HttpException") or is_a($throwable, 'HttpError')) {
            return $throwable->getCode();
        }

        return 500;
    }


    public function __invoke(Request $request, Response $response, Throwable $throwable): Response {

        $code = ErrorHandler::getHTTPSaveExceptionCode($throwable);
        $errorUniqueId = ErrorHandler::logException($throwable, $code >= 500);

        if (!is_a($throwable, "Slim\Exception\HttpException")) {
            $throwable = new \Slim\Exception\HttpException($request, $throwable->getMessage(), $code, $throwable);
            if (method_exists($throwable, 'getTitle')) {
                $throwable->setTitle($throwable->getTitle());
            }
        }

        return $response
            ->withStatus($throwable->getCode(), $throwable->getTitle())
            ->withHeader('Content-Type', 'text/html')
            ->withHeader('Error-ID', $errorUniqueId)
            ->write($throwable->getMessage() ? $throwable->getMessage() : $throwable->getDescription());
    }
}

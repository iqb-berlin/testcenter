<?php

use Slim\App;

define('ROOT_DIR', realpath(dirname(__FILE__) . '/..'));

require_once ROOT_DIR . "/vendor/autoload.php";
require_once "autoload.php";
require_once "helpers.php";

session_start();


$app = new App();

require_once "authMiddlewares.php";

$container = $app->getContainer();
$container['code_directory'] = realpath(ROOT_DIR . "/vo_code");
$container['data_directory'] = realpath(ROOT_DIR . "/vo_data");
$container['conf_directory'] = realpath(ROOT_DIR . "/config");

$container['errorHandler'] = function($container) {
    return function (Slim\Http\Request $request, Slim\Http\Response $response, Exception $exception) use ($container) {

        error_log("[Error: " . $exception->getCode() . "]". $exception->getMessage());
        error_log("[Error: " . $exception->getCode() . "]".  $exception->getFile() . ' | line ' . $exception->getLine());

        if (!is_a($exception, "Slim\Exception\HttpException")) {
            $exception = new \Slim\Exception\HttpException($request, $exception->getMessage(), 500, $exception);
        }

        error_log("[Error: " . $exception->getCode() . "]". $exception->getTitle());
        error_log("[Error: " . $exception->getCode() . "]". $exception->getDescription());

        return $response
            ->withStatus($exception->getCode())
            ->withHeader('Content-Type', 'text/html')
            ->write($exception->getMessage() ? $exception->getMessage() : $exception->getDescription());
    };
};

include_once 'routes/system.php';
include_once 'routes/login_deprecated.php';
include_once 'routes/workspace.php';
include_once 'routes/workspace_old.php';
include_once 'routes/user_old.php';
include_once 'routes/workspace_deprecated.php';

try {
    $app->run();
} catch (Throwable $e) {
    error_log('fatal error:' . $e->getMessage());
}

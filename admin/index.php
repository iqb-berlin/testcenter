<?php

use Slim\App;
use Slim\Container;

try {

    define('ROOT_DIR', realpath(dirname(__FILE__) . '/..'));

    require_once ROOT_DIR . "/vendor/autoload.php";
    require_once "autoload.php";

    session_start();

    $container = new Container();
    $container['errorHandler'] = function(/** @noinspection PhpUnusedParameterInspection */ $c) {
        return new ErrorHandler();
    };
    $container['phpErrorHandler'] = function(/** @noinspection PhpUnusedParameterInspection */ $c) {
        return new ErrorHandler();
    };
    $container['settings']['displayErrorDetails'] = true;
    $app = new App($container);

    include_once 'routes/system.php';
    include_once 'routes/workspace.php';
    include_once 'routes/user.php';

    include_once 'routes/user_deprecated.php';
    include_once 'routes/login_deprecated.php';
    include_once 'routes/workspace_deprecated.php';
    include_once 'routes/system_deprecated.php';

    $app->run();

} catch (Throwable $e) {

    // this can only happen if slim itself or slim error handler fails or some class fails in constructor
    http_response_code(500);
    error_log('Fatal error:' . $e->getMessage());
    echo "Fatal error: " . $e->getMessage();

}

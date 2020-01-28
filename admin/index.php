<?php

use Slim\App;

define('ROOT_DIR', realpath(dirname(__FILE__) . '/..'));

require_once ROOT_DIR . "/vendor/autoload.php";
require_once "autoload.php";

session_start();

$app = new App();
$container = $app->getContainer();
$container['errorHandler'] = function(/** @noinspection PhpUnusedParameterInspection */ $c){
    return new ErrorHandler();
};

include_once 'routes/system.php';
include_once 'routes/workspace.php';
include_once 'routes/user.php';

include_once 'routes/user_deprecated.php';
include_once 'routes/login_deprecated.php';
include_once 'routes/workspace_deprecated.php';
include_once 'routes/system_deprecated.php';
//include_once 'routes/user_deprecated.php';

try {
    $app->run();
} catch (Throwable $e) {
    // this can only happen if slim itself or slim error handler fails
    http_response_code(500);
    error_log('Fatal error:' . $e->getMessage());
    echo "Fatal error: " . $e->getMessage();
}

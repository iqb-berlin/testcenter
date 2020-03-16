<?php

use Slim\App;
use Slim\Container;

try {

    define('ROOT_DIR', dirname(__FILE__));

    require_once "vendor/autoload.php";
    require_once "autoload.php";

    if (isset($_SERVER['HTTP_TESTMODE'])) {

        include_once 'initVirtualEnvironment.php';

    } else {

        define('DATA_DIR', ROOT_DIR . '/vo_data'); // TODO make configurable
        DB::connect(DBConfig::fromFile(ROOT_DIR . '/config/DBConnectionData.json'));
    }

    $container = new Container();
    $container['errorHandler'] = function(/** @noinspection PhpUnusedParameterInspection */ $c) {
        return new ErrorHandler();
    };
    $container['phpErrorHandler'] = function(/** @noinspection PhpUnusedParameterInspection */ $c) {
        return new ErrorHandler();
    };
    $container['settings']['displayErrorDetails'] = true;
    $app = new App($container);

    include_once 'routes/session.php';
    include_once 'routes/system.php';
    include_once 'routes/workspace.php';
    include_once 'routes/user.php';

    include_once 'routes/test.php';
    include_once 'routes/booklet.php';
    include_once 'routes/syscheck.php';

    $app->run();

} catch (Throwable $e) {

    // this can only happen if slim itself or slim error handler fails or some class fails in constructor
    http_response_code(500);
    error_log('Fatal error:' . $e->getMessage());
    error_log($errorPlace = $e->getFile() . ' | line ' . $e->getLine());
    echo "Fatal error: " . $e->getMessage();
}

<?php

declare(strict_types=1);

use Slim\App;
use Slim\Container;


try {

    date_default_timezone_set('Europe/Berlin');

    define('ROOT_DIR', dirname(__FILE__));

    require_once "vendor/autoload.php";
    require_once "autoload.php";

    if (isset($_SERVER['HTTP_TESTMODE'])) {

        if (file_exists(ROOT_DIR . "/config/e2eTests.json")) {

            TestEnvironment::setUpEnvironmentForRealDataE2ETests(); // DANGEROUS!!!

        } else {

            TestEnvironment::setUpEnvironmentForE2eTests();
        }

    } else { // productive

        /* @var $config SystemConfig */
        $config = SystemConfig::fromFile(ROOT_DIR . '/config/system.json');
        define('DATA_DIR', ROOT_DIR . '/vo_data'); // TODO make configurable
        BroadcastService::setup($config);

        DB::connect();
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
    include_once 'routes/speedtest.php';
    include_once 'routes/monitor.php';

    $app->run();

} catch (Throwable $e) {

    // this can only happen if slim itself or slim error handler fails or some class fails in constructor
    http_response_code(500);
    error_log('Fatal error:' . $e->getMessage());
    error_log($errorPlace = $e->getFile() . ' | line ' . $e->getLine());
    echo "Fatal error: " . $e->getMessage();
}

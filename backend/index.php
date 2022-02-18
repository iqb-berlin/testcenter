<?php

declare(strict_types=1);

use Slim\App;
use Slim\Container;


try {

    date_default_timezone_set('Europe/Berlin'); // just to be safe. TimeStamp-class should be used everywhere anyway

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
        TimeStamp::setup();
        BroadcastService::setup($config->broadcastServiceUriPush, $config->broadcastServiceUriSubscribe);
        XMLSchema::setup($config->allowExternalXMLSchema);

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
    $container['settings']['addContentLengthHeader'] = true;
    $app = new App($container);

    include_once 'routes.php';

    $app->run();

} catch (Throwable $e) {

    // this can only happen if slim itself or slim error handler fails or some class fails in constructor
    http_response_code(500);
    $id = uniqid('fatal-', true);
    header('Error-ID:' . $id);
    error_log("$id (500) at {$e->getFile()}:{$e->getLine()}");
    error_log($e->getMessage());
    echo "Fatal error!" . "$id (500) at {$e->getFile()}:{$e->getLine()}";
}

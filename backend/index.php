<?php

declare(strict_types=1);

//use Slim\App;
//use Slim\Container;
use DI\Container;
use Slim\Factory\AppFactory;
use Slim\Psr7\Request;
use Slim\Psr7\Response;


try {

    date_default_timezone_set('Europe/Berlin'); // just to be safe. TimeStamp-class should be used everywhere anyway

    define('ROOT_DIR', realpath(dirname(__FILE__) . '/../'));

    require_once "vendor/autoload.php";
    require_once "autoload.php";


    $isPreparedForRealDataTest = getenv('TESTMODE_REAL_DATA', true) || getenv('TESTMODE_REAL_DATA');
    $isTestModeRequested = isset($_SERVER['HTTP_TESTMODE']);

    if ($isTestModeRequested and $isPreparedForRealDataTest) {

        // dangerous: uses the real MySql database and the real data-directory for testing. Data gets erased.
        TestEnvironment::setUpEnvironmentForRealDataE2ETests();

    } else if ($isTestModeRequested) {

        TestEnvironment::setUpEnvironmentForE2eTests();

    } else { // productive

        /* @var $config SystemConfig */
        $config = SystemConfig::fromFile(ROOT_DIR . '/backend/config/system.json');
        define('DATA_DIR', ROOT_DIR . '/data');
        TimeStamp::setup();
        BroadcastService::setup($config->broadcastServiceUriPush, $config->broadcastServiceUriSubscribe);
        XMLSchema::setup($config->allowExternalXMLSchema);

        DB::connect();
    }

//    $container = new Container();


    $container = new Container();

//    $container['errorHandler'] = function(/** @noinspection PhpUnusedParameterInspection */ $c) {
//        return new ErrorHandler();
//    };
//    $container['phpErrorHandler'] = function(/** @noinspection PhpUnusedParameterInspection */ $c) {
//        return new ErrorHandler();
//    };
//    $container['settings']['displayErrorDetails'] = true;
//    $container['settings']['addContentLengthHeader'] = true;


    AppFactory::setContainer($container);
    $app = AppFactory::create();

    $app->addRoutingMiddleware();
    $errorMiddleware = $app->addErrorMiddleware(true, true, true);
    $errorMiddleware->setDefaultErrorHandler(new ErrorHandler());

//    $app = new App($container);


    $app->setBasePath('/testcenter/backend'); // TODO use Server::getUrl() or what to get the correct path

    include_once 'routes.php';

    $app->run();

} catch (Throwable $e) {

    // this can only happen if slim itself or slim error handler fails or some class fails in constructor
    http_response_code(500);
    $id = uniqid('fatal-', true);
    header('Error-ID:' . $id);
    error_log("$id (500) at {$e->getFile()}:{$e->getLine()}");
    error_log($e->getMessage());
    echo "Fatal error!" . "$id (500) at {$e->getFile()}:{$e->getLine()} : {$e->getMessage()}";
}

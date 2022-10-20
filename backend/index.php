<?php

declare(strict_types=1);

use DI\Container;
use Slim\Factory\AppFactory;
use Slim\Http\ServerRequest as Request;
use Slim\Http\Response;

$rd = realpath(dirname(__FILE__) . '/../');
$unit = "/testcenter/backend/test/7/unit/UNIT.SAMPLE/alias/UNIT.SAMPLE";
$test = "/testcenter/backend/test/7";
$res =  "/testcenter/backend/test/7/resource/SAMPLE_UNITCONTENTS.HTM?v=f";
$sup =  "/testcenter/backend/workspace/9";
$supd =  "/testcenter/backend/workspace/9/files";

$bp = '/testcenter/backend/test/14/resource/huge.htm?v=';




try {

    date_default_timezone_set('Europe/Berlin'); // just to be safe. TimeStamp-class should be used everywhere anyway

    define('ROOT_DIR', realpath(dirname(__FILE__) . '/../'));

    require_once "vendor/autoload.php";
    require_once "autoload.php";

    if(
        ($_SERVER['REQUEST_URI'] == $res) and
        ($_SERVER['REQUEST_METHOD'] != 'OPTIONS')
    ) {
        if (file_exists("$rd/x.x")) {
            unlink("$rd/x.x");
        } else {
            file_put_contents("$rd/x.x", "[{$_SERVER['REQUEST_METHOD']}] {$_SERVER['REQUEST_URI']}");
        header("HTTP/1.0 404 I'm A Teapot");die();
//        ////    header('Location: http://the.void');
//        //        die("not ok");
//                throw new HttpError('dying', 500);
//        die();
//        throw new \Slim\Exception\HttpException('shit', 403);
        }
    }

    $isPreparedForRealDataTest =
        (getenv('TESTMODE_REAL_DATA', true) == 'yes') ||
        (getenv('TESTMODE_REAL_DATA') == 'yes');
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

    $container = new Container();
    AppFactory::setContainer($container);
    $app = AppFactory::create();

    $app->addRoutingMiddleware();
    $errorMiddleware = $app->addErrorMiddleware(true, true, true);
    $errorMiddleware->setDefaultErrorHandler(new ErrorHandler());

    $projectPath = Server::getProjectPath();
    if ($projectPath) {
        $app->setBasePath($projectPath);
    }

    $app->options('/{routes:.+}', function(Request $request, Response $response) {
        return $response;
    });

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

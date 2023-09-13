<?php

declare(strict_types=1);

use DI\Container;
use Slim\Factory\AppFactory;
use Slim\Http\ServerRequest as Request;
use Slim\Http\Response;

try {
  date_default_timezone_set('Europe/Berlin'); // just to be safe. TimeStamp-class should be used everywhere anyway

  define('ROOT_DIR', realpath(dirname(__FILE__) . '/../'));

  require_once "vendor/autoload.php";

  if (isset($_SERVER['HTTP_TESTMODE'])) {
    TestEnvironment::setup($_SERVER['HTTP_TESTMODE'], $_SERVER['HTTP_TESTCLOCK']);
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

  if (($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') and file_exists(ROOT_DIR . '/backend/config/init.lock')) {
    http_response_code(503);
    header('Retry-After:30');
    echo "Service is restarting";
    exit;
  }

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
  $path = explode('/', $e->getFile());
  echo "Fatal error (500) at {$path[count($path)-2]}/{$path[count($path)-1]}:{$e->getLine()} : {$e->getMessage()}";
}

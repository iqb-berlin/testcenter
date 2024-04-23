<?php

declare(strict_types=1);

use DI\Container;
use Slim\Factory\AppFactory;
use Slim\Http\Response;
use Slim\Http\ServerRequest as Request;

function fatalErrorHandler(Throwable $e): void {
  // this can only happen if slim itself or slim error handler fails or some class fails in constructor
  http_response_code(500);
  $id = uniqid('fatal-', true);
  header('Error-ID:' . $id);
  error_log("$id (500) at {$e->getFile()}:{$e->getLine()}");
  error_log($e->getMessage());
  $path = explode('/', $e->getFile());
  echo "Fatal error (500) at {$path[count($path)-2]}/{$path[count($path)-1]}:{$e->getLine()} : {$e->getMessage()}";
  exit(1);
}

$start = microtime(true);
$max_mem = 0;

function paf_log(string|object|array $entry): void {
  global $start, $max_mem;
  $bt = debug_backtrace(DEBUG_BACKTRACE_PROVIDE_OBJECT|DEBUG_BACKTRACE_IGNORE_ARGS,12);
  array_shift($bt);
  $s = array_map(function($entry) {
    $id = is_object($entry['object']) ? spl_object_id($entry['object']) : '_';
    $c = str_pad($entry['class'], 10);
    $i = str_pad((string) $id, 4);
    $f = str_pad($entry['function'], 50);
    return "[$c:$i → $f]";
  }, $bt);
  $bts = implode("\t←\t", $s);
  $t = number_format(microtime(true) - $start, 15);
  $m = max($max_mem, memory_get_usage());
  if (is_array($entry)) {
    $e = implode("\n", $entry);
  } else if (is_object($entry)) {
    $e = var_export($entry, true);
  } else {
    $e = str_pad($entry, 36);
  }
  file_put_contents('/var/www/data/paf.log', "[$t]\t[$m]\t$e\t← $bts\n",  FILE_APPEND );
}

try {
  ini_set('display_errors', '0');
  ini_set('display_startup_errors', '0');
  register_shutdown_function(function() {
    $e = error_get_last();
    if(!is_null($e) and in_array($e['type'], [E_ERROR, E_COMPILE_ERROR, E_CORE_ERROR])) {
      fatalErrorHandler(new ErrorException($e['message'], 1, 1, $e['file'], $e['line']));
    }
    paf_log('finish');
  });

  define('ROOT_DIR', realpath(dirname(__FILE__) . '/../'));

  require_once "vendor/autoload.php";

  // TODO move this to .htaccess
  if (($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') and file_exists(ROOT_DIR . '/backend/config/error.lock')) {
    throw new Exception("Service could not be started correctly! Please refer to your system administrator.");
  }

  // TODO move this to .htaccess
  if (($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') and file_exists(ROOT_DIR . '/backend/config/init.lock')) {
    http_response_code(503);
    header('Retry-After:30');
    echo "Service is restarting.";
    exit;
  }

  SystemConfig::read();

  if (isset($_SERVER['HTTP_TESTMODE'])) {
    TestEnvironment::setup($_SERVER['HTTP_TESTMODE'], $_SERVER['HTTP_TESTCLOCK'] ?? null);
  } else { // productive
    define('DATA_DIR', ROOT_DIR . '/data');
    date_default_timezone_set(SystemConfig::$system_timezone); // just to be safe. TimeStamp-class should be used everywhere anyway
    DB::connect();
  }

  $container = new Container();
  AppFactory::setContainer($container);
  $app = AppFactory::create();

  $app->addRoutingMiddleware();
  $errorMiddleware = $app->addErrorMiddleware(true, true, true);
  $errorHandler = new ErrorHandler();
  $errorMiddleware->setDefaultErrorHandler($errorHandler);

  $projectPath = Server::getProjectPath();
  if ($projectPath) {
    $app->setBasePath($projectPath);
  }

  $app->options('/{routes:.+}', function(Request $request, Response $response): Response {
    return $response;
  });

  include_once 'routes.php';

  $app->any('/{path:.*}', function (Request $request, Response $response): Response {
    return $response
      ->withStatus(404);
  });

  $app->run();

} catch (Throwable $e) {
  fatalErrorHandler($e);
}

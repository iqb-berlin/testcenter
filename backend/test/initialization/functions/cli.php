<?php
function runCli(callable $callback): void {
  if (php_sapi_name() !== 'cli') {
    header('HTTP/1.0 403 Forbidden');
    echo "This is only for usage from command line.";
    exit(1);
  }

  error_reporting(E_ALL);

  define('ROOT_DIR', realpath(dirname(__FILE__) . '/../../../..'));
  define('DATA_DIR', ROOT_DIR . '/data');

  require_once ROOT_DIR . "/backend/vendor/autoload.php";

  try {
    DB::connect();
    $callback();

  } catch (Exception $exception) {
    echo "\n" . $exception->getMessage() . "\n";
    ErrorHandler::logException($exception, true);
    exit(1);
  }

  exit(0);
}

<?php

define('ROOT_DIR', realpath(dirname(__FILE__) . '/..'));

use Slim\App;

session_start();

require_once ROOT_DIR . "/vendor/autoload.php";
require_once ROOT_DIR . "/vo_code/DBConnection.php";
require_once ROOT_DIR . "/vo_code/DBConnectionAdmin.php";
require_once ROOT_DIR . "/vo_code/DBConnectionSuperadmin.php";
require_once ROOT_DIR . "/vo_code/FilesFactory.php";
require_once ROOT_DIR . '/vo_code/XMLFile.php';
require_once ROOT_DIR . '/vo_code/XMLFileBooklet.php';
require_once ROOT_DIR . '/vo_code/XMLFileUnit.php';
require_once ROOT_DIR . '/vo_code/XMLFileTesttakers.php';
require_once ROOT_DIR . '/vo_code/XMLFileSysCheck.php';
require_once ROOT_DIR . '/vo_code/XMLFileTesttakers.php';
require_once ROOT_DIR . '/admin_v2/classes/controller/workspaceController.class.php';
require_once ROOT_DIR . '/admin_v2/classes/controller/workspaceValidator.class.php';

/**
 * TODO refactor DBCONNECTION
 * we assume it will throw exceptions on error
 */
require_once "helpers.php";

require_once ROOT_DIR . "/admin_v2/classes/exception/HttpException.class.php";
require_once ROOT_DIR . "/admin_v2/classes/exception/HttpSpecializedException.class.php";
require_once ROOT_DIR . "/admin_v2/classes/exception/HttpBadRequestException.class.php";
require_once ROOT_DIR . "/admin_v2/classes/exception/HttpForbiddenException.class.php";
require_once ROOT_DIR . "/admin_v2/classes/exception/HttpInternalServerErrorException.class.php";
require_once ROOT_DIR . "/admin_v2/classes/exception/HttpNotFoundException.class.php";
require_once ROOT_DIR . "/admin_v2/classes/exception/HttpUnauthorizedException.class.php";
/**
 * note: we don't want to upgrade slack right no, since we do not know the implications, (TODO: update slack)
 * but we allready use the slack 4 exceptions.
 */

$app = new App();

require_once "authMiddlewares.php";

$container = $app->getContainer();
$container['code_directory'] = realpath(ROOT_DIR . "/vo_code");
$container['data_directory'] = realpath(ROOT_DIR . "/vo_data");
$container['conf_directory'] = realpath(ROOT_DIR . "/config");

$container['errorHandler'] = function($container) {
    return function (Slim\Http\Request $request, Slim\Http\Response $response, Exception $exception) use ($container) {

        error_log("[Error: " . $exception->getCode() . "]". $exception->getMessage());
        error_log("[Error: " . $exception->getCode() . "]".  $exception->getFile() . ' | line ' . $exception->getLine());

        if (!is_a($exception, "Slim\Exception\HttpException")) {
            $exception = new \Slim\Exception\HttpException($request, $exception->getMessage(), 500, $exception);
        }

        error_log("[Error: " . $exception->getCode() . "]". $exception->getTitle());
        error_log("[Error: " . $exception->getCode() . "]". $exception->getDescription());

        return $response
            ->withStatus($exception->getCode())
            ->withHeader('Content-Type', 'text/html')
            ->write($exception->getMessage() ? $exception->getMessage() : $exception->getDescription());
    };
};

include_once 'routes/system.php';
include_once 'routes/login_deprecated.php';
include_once 'routes/workspace.php';
include_once 'routes/workspace_old.php';
include_once 'routes/user_old.php';
include_once 'routes/workspace_deprecated.php';

try {
    $app->run();
} catch (Throwable $e) {
    error_log('fatal error:' . $e->getMessage());
}

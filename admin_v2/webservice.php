<?php
/**
 * this file loads slim and all necessary stuff
 * to keep the old file structure FOR NOW it will be included in every endpoint file
 * later it will be the only endpoint file at all, including the route files
 *
 *
 */

$ROOT_DIR = realpath(dirname(__FILE__)) . '/..';

use Slim\App;

session_start();

require_once "$ROOT_DIR/vendor/autoload.php";
require_once "$ROOT_DIR/vo_code/DBConnection.php";
require_once "$ROOT_DIR/vo_code/DBConnectionAdmin.php";
require_once "$ROOT_DIR/vo_code/DBConnectionSuperadmin.php";
require_once "$ROOT_DIR/vo_code/FilesFactory.php";

/**
 * TODO refactor DCCONNECTION
 * we assume it will throw exceptions on error
 */
require_once "helpers.php";

require_once "$ROOT_DIR/admin_v2/classes/exception/HttpException.class.php";
require_once "$ROOT_DIR/admin_v2/classes/exception/HttpSpecializedException.class.php";
require_once "$ROOT_DIR/admin_v2/classes/exception/HttpBadRequestException.class.php";
require_once "$ROOT_DIR/admin_v2/classes/exception/HttpForbiddenException.class.php";
require_once "$ROOT_DIR/admin_v2/classes/exception/HttpInternalServerErrorException.class.php";
require_once "$ROOT_DIR/admin_v2/classes/exception/HttpNotFoundException.class.php";
require_once "$ROOT_DIR/admin_v2/classes/exception/HttpUnauthorizedException.class.php";
/**
 * note: we don't want to upgrade slack right no, since we do not know the implications, (TODO: update slack)
 * but we allready use the slack 4 exceptions.
 */

$app = new App();

$container = $app->getContainer();
$container['code_directory'] = realpath("$ROOT_DIR/vo_code");
$container['data_directory'] = realpath("$ROOT_DIR/vo_data");
$container['conf_directory'] = realpath("$ROOT_DIR/config");

$container['errorHandler'] = function($container) {
    return function ($request, $response, $exception) use ($container) {
        return errorOut($request, $response, $exception);
    };
};

$dbConnection = new DBConnectionSuperadmin();

<?php

include_once 'webservice.php';
$dbConnection = new DBConnectionAdmin();

include_once 'routes/system.php';
include_once 'routes/login_depricated.php';
include_once 'routes/workspace.php';
include_once 'routes/workspace_old.php';
include_once 'routes/user_old.php';
include_once 'routes/workspace_deprecated.php';

try {
    $app->run();
} catch (Throwable $e) {
    error_log('fatal error:' . $e->getMessage());
}

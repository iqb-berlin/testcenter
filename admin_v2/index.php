<?php

include_once 'webservice.php';
$dbConnection = new DBConnectionAdmin();

include_once  'routes/system.php';
include_once  'routes/workspace.php';
include_once  'routes/workspace_deprecated_a.php';
include_once  'routes/workspace_deprecated_b.php';

try {
    $app->run();
} catch (Throwable $e) {
    error_log('fatal error:' . $e->getMessage());
}

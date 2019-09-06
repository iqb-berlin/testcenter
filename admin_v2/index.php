<?php

include_once 'webservice.php';
$dbConnection = new DBConnectionAdmin();

include_once  'routes/workspace.php';

try {
    $app->run();
} catch (Throwable $e) {
    error_log('fatal error:' . $e->getMessage());
}

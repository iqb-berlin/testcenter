<?php
declare(strict_types=1);

define('ROOT_DIR', realpath(__DIR__ . '/../../..'));
set_include_path(realpath(__DIR__ . '/..'));
require_once ROOT_DIR . "/backend/vendor/autoload.php";

// configured from the environment like the backend itself, so the tests reach the storage it would use
SystemConfig::readEnvironment();

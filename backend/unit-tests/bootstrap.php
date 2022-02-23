<?php

set_include_path(realpath(__DIR__ . '/..'));

require_once dirname(__DIR__) . "/vendor/autoload.php";

define('REAL_ROOT_DIR', realpath(__DIR__ . '/../..')); // in some tests ROOT_DIR is set inside vfs

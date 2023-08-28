<?php

define('REAL_ROOT_DIR', realpath(__DIR__ . '/../../..')); // in some tests ROOT_DIR is set inside vfs

set_include_path(realpath(__DIR__ . '/..'));

require_once REAL_ROOT_DIR . "/backend/vendor/autoload.php";

// connect once to test to check if it is available beforehand
require_once 'TestDB.class.php';
TestDB::setUp();
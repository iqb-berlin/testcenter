<?php
define('REAL_ROOT_DIR', realpath(__DIR__ . '/../..'));
require_once 'unit/TestDB.class.php';
TestDB::setUp(true);
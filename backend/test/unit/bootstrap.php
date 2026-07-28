<?php

define('ROOT_DIR', realpath(__DIR__ . '/../../..'));
set_include_path(realpath(__DIR__ . '/..'));
require_once ROOT_DIR . "/backend/vendor/autoload.php";

SystemConfig::readEnvironment();
SystemConfig::$bruteForceProtection_sessions = [];
SystemConfig::$server_key = 'Secret';

SystemConfig::$debug_allowExternalXmlSchema = false;
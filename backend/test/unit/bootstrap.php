<?php

define('ROOT_DIR', realpath(__DIR__ . '/../../..'));
set_include_path(realpath(__DIR__ . '/..'));
require_once ROOT_DIR . "/backend/vendor/autoload.php";

try {
  SystemConfig::read();
} catch (Exception $exception) {
  SystemConfig::readFromEnvironment();
}

SystemConfig::$debug_allowExternalXmlSchema = false;
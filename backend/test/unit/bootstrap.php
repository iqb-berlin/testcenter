<?php

define('ROOT_DIR', realpath(__DIR__ . '/../../..'));
set_include_path(realpath(__DIR__ . '/..'));
require_once ROOT_DIR . "/backend/vendor/autoload.php";

try {
  // todo kann das weg?
  SystemConfig::readConfigIni();
} catch (Exception $exception) {
  SystemConfig::readEnvironment();
}

SystemConfig::$debug_allowExternalXmlSchema = false;
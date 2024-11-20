<?php
define('ROOT_DIR', realpath(__DIR__ . '/..'));
const DATA_DIR = ROOT_DIR . '/data';
exit(file_exists(ROOT_DIR . '/backend/config/init.lock') ? 1 : 0);

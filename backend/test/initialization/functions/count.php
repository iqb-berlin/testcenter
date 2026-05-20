<?php
require_once "cli.php";

runCli(function() {
  $table = getopt("", ['table::'])['table'];
  $initDAO = new InitDAO();
  echo (int) $initDAO->_("SELECT COUNT(*) AS c FROM $table")['c'];
});

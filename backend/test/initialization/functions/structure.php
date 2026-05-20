<?php
require_once "cli.php";

runCli(function() {
  $initDAO = new InitDAO();
  echo "# testcenter-db-dump";
  $tables = $initDAO->_('SHOW TABLES', [], true); // this works only with MySQL/MariaDB
  foreach ($tables as $entry) {
    $table = array_pop($entry);
    $columns = $initDAO->_("SHOW COLUMNS FROM $table", [], true);
    echo "\n$table:";
    foreach ($columns as $row) {
      foreach ($row as $key => $value) {
        $s = $key === 'Field' ? '-' : ' ';
        echo "\n $s $key: \"$value\"";
      }
    }
  }
  echo "\n";
});

<?php
require_once "cli.php";

runCli(function() {
    $table = getopt("", ['table::'])['table'];
    $initDAO = new InitDAO();
    echo (int) $initDAO->_("select count(*) as c from $table")['c'];
});

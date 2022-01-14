<?php
require_once "cli.php";

runCli(function() {
    $stdin = fopen('php://stdin', 'r');
    $strChar = stream_get_contents($stdin);
    echo "\n execute `$strChar`";
    $initDAO = new InitDAO();
    $r = $initDAO->_($strChar);
    print_r($r);
    fclose($stdin);
});
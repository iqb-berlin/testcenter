<?php
require_once "cli.php";

runCli(function() {
    $stdin = fopen('php://stdin', 'r');
    $strChar = trim(stream_get_contents($stdin));
    $initDAO = new InitDAO();
    try {
        $result = $initDAO->_($strChar, [], true);
        if ($result and count($result)) {
            $result = array_map('array_values', $result);
            echo json_encode($result);
        }
    } catch (Exception $exception) {
        echo "Error: {$exception->getMessage()}\n";
        exit(1);
    }

    fclose($stdin);
});
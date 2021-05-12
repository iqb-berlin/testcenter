<?php

if (php_sapi_name() !== 'cli') {

    header('HTTP/1.0 403 Forbidden');
    echo "This is only for usage from command line.";
    exit(1);
}

define('ROOT_DIR', realpath(dirname(__FILE__) . '/..'));
define('DATA_DIR', ROOT_DIR . '/vo_data');

require_once(ROOT_DIR . '/autoload.php');

try  {

    DB::connect();

    $initDAO = new InitDAO();
    echo "# testcenter-db-dump";
    // this works only with MySQL/MariaDB
    $d = $initDAO->_('show tables', [], true);
    foreach ($d as $entry) {
        $table = array_pop($entry);
        $e = $initDAO->_("show columns from $table", [], true);
        echo "\n$table:";
        foreach ($e as $row) {
            foreach ($row as $key => $value) {
                $s = $key === 'Field' ? '-' : ' ';
                echo "\n $s $key: \"$value\"";
            }
        }
    }
    //var_dump($d);
    echo "\n";

} catch (Exception $e) {

    echo "\n" . $e->getMessage() . "\n";
    ErrorHandler::logException($e, true);
    exit(1);
}

echo "\n";
exit(0);

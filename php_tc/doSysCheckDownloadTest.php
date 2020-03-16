<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
}
$start = microtime(true);
if (function_exists('apache_setenv')) {
    apache_setenv('no-gzip', '1');
}
//$_GET = json_decode(file_get_contents('php://input'), true);

if (!isset($_GET['size']) or (!intval($_GET['size'])) or (intval($_GET['size']) > 8388608 * 8) or (intval($_GET['size']) < 16)) {
    http_response_code(404);
    echo "Unsupported test size ({$_GET['size']})";
    exit(1);
}

header('Content-Transfer-Encoding: binary');
header('Content-Type: text/plain');
echo $_SERVER['REQUEST_TIME_FLOAT'];
echo '/';

$allowedChars = "ABCDEFGHIJKLOMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz0123456789+/";
$length = intval($_GET['size']) - strlen($_SERVER['REQUEST_TIME_FLOAT']) - 1;
while ($length-- > 1) {
    echo substr($allowedChars, rand(0, strlen($allowedChars) - 1), 1);
}
echo '=';
$time_elapsed_secs = microtime(true) - $start;
echo $time_elapsed_secs;

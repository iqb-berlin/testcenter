<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
}

$POST = json_decode(file_get_contents('php://input'), true);

if (!isset($POST['size']) or (!intval($POST['size'])) or (intval($POST['size']) > 4194304) or (intval($POST['size']) < 16)) {
    http_response_code(404);
    echo "Unsupported test size ({$POST['size']})";
    exit(1);
}

header('Content-Transfer-Encoding: binary');
header('Content-Type: text/plain');

echo $_SERVER['REQUEST_TIME_FLOAT'];
echo '/';

$allowedChars = "ABCDEFGHIJKLOMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz0123456789+/";
$length = intval($POST['size']) - strlen($_SERVER['REQUEST_TIME_FLOAT']) - 1;
while ($length-- > 1) {
    echo substr($allowedChars, rand(0, strlen($allowedChars) - 1), 1);
}
echo '=';

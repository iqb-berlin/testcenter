<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
}

if (!isset($_GET['size']) or (!intval($_GET['size'])) or (intval($_GET['size']) > 4194304)) {
    http_response_code(404);
    echo "Unsupported test size ({$_GET['size']})";
    exit(1);
}

header('Content-Transfer-Encoding: binary');
header('Content-Type: text/plain');

$allowedChars = "ABCDEFGHIJKLOMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz0123456789+/";
$length = intval($_GET['size']);
while ($length-- > 1) {
    echo substr($allowedChars, rand(0, strlen($allowedChars) - 1), 1);
}
echo '=';

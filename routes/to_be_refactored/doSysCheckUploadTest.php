<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
}

$response = Array();
$response['requestTime'] = $_SERVER['REQUEST_TIME_FLOAT'];
$response['packageReceivedSize']  = $_SERVER['CONTENT_LENGTH'];
sleep(1);

header('Content-Type: application/json');
echo json_encode($response);

?>

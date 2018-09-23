<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// returns laststate-entry by logintoken and code and bookletname (if there is any)

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
} else {
	require_once('../vo_code/DBConnectionStart.php');

	// *****************************************************************
	$myreturn = '';

	$myerrorcode = 503;

	$myDBConnection = new DBConnectionStart();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 401;

		$data = json_decode(file_get_contents('php://input'), true);
		$myToken = $data["pt"];
		$myBooklet = $data["b"];

		if (isset($myToken) && isset($myBooklet)) {
			$myreturn = $myDBConnection->getBookletStatusPI($myToken, $myBooklet);
			if ($myreturn !== []) {
				$myerrorcode = 0;
			}
		}				
	}    
	unset($myDBConnection);

	if ($myerrorcode > 0) {
		http_response_code($myerrorcode);
	} else {
		echo(json_encode($myreturn));
	}
}
?>
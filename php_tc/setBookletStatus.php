<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
} else {
	require_once('../vo_code/DBConnectionTC.php');

	// *****************************************************************
	$myreturn = false;

	$myerrorcode = 503;

	$myDBConnection = new DBConnectionTC();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 401;

		$data = json_decode(file_get_contents('php://input'), true);
		$auth = $data["au"];
		if ($myDBConnection->authOk($auth, true)) {
			$myerrorcode = 0;
			$state = $data["state"];
			$myreturn = $myDBConnection->setBookletStatus($myDBConnection->getBookletId($auth), $state);
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
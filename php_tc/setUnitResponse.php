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
		$unit = $data["u"];
		$data = $data["d"];

		if ($myDBConnection->authOk($auth)) {
			$myerrorcode = 0;
			if ($myDBConnection->addUnitResponse($myDBConnection->getBookletId($auth), $unit, $data)) {
				$myreturn = true;
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
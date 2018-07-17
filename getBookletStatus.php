<?php
	// returns laststate-entry by logintoken and code and bookletname (if there is any)

	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('tc_code/DBConnectionLogin.php');

		// *****************************************************************
		$myreturn = '';

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionLogin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$data = json_decode(file_get_contents('php://input'), true);
			$myToken = $data["lt"];
			$myCode = $data["c"];
			$myBooklet = $data["b"];

			if (isset($myToken) && isset($myCode) && isset($myBooklet)) {
				$myerrorcode = 0; // if there is no booklet in the database yet, this is not an error
				$myreturn = $myDBConnection->getBookletStatus($myToken, $myCode, $myBooklet);
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
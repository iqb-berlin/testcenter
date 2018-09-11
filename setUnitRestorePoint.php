<?php
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('vo_code/DBConnectionSession.php');

		// *****************************************************************
		$myreturn = '?';

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionSession();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$data = json_decode(file_get_contents('php://input'), true);
			$myToken = $data["st"];
			$myUnit = $data["u"];
			$state = $data["restorepoint"];

			if (isset($myToken)) {
				$tokensplits = explode('##', $myToken);
				if (count($tokensplits) == 2) {
					$sessiontoken = $tokensplits[0];
					$bookletDBId = $tokensplits[1];
					if ($myDBConnection->canWriteBookletData($sessiontoken, $bookletDBId) === true) {
						$myerrorcode = 0;
						$myreturn = $myDBConnection->setUnitStatus_restorepoint($bookletDBId, $myUnit, $state);
					}
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
<?php
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('tc_code/DBConnectionSession.php');

		// *****************************************************************
		$myreturn = ['xml' => '', 'status' => ''];

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionSession();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$data = json_decode(file_get_contents('php://input'), true);
			$myToken = $data["st"];
			$myResourceId = $data["r"];

			if (isset($myToken)) {
				$tokensplits = explode('##', $myToken);
				if (count($tokensplits) == 2) {
					$sessiontoken = $tokensplits[0];

					$wsId = $myDBConnection->getWorkspaceBySessiontoken($sessiontoken);
					if ($wsId > 0) {
						$myerrorcode = 404;
						$path_parts = pathinfo($myResourceId); // extract filename if path is given
						$myFullfilename = 'tc_data/ws_' . $wsId . '/Resource' . '/' . $path_parts['basename'];
						if (file_exists($myFullfilename)) {
							$myerrorcode = 0;
							header("Content-disposition: attachment; filename='" . $path_parts['basename'] . "'");
							header("Content-Type: application/octet-stream");
							ob_clean();
							flush();
							readfile($myFullfilename);
						}
					}
				}				
			}
		}    
		unset($myDBConnection);

		if ($myerrorcode > 0) {
			http_response_code($myerrorcode);
		}
	}
?>
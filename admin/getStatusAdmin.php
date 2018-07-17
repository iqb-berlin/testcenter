<?php
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		$myreturn = [
			'admintoken' => '',
			'name' => '',
			'workspaces' => []
		];
		$myerrorcode = 503;

		$data = json_decode(file_get_contents('php://input'), true);
		$myAToken = $data["at"];

		if (isset($myAToken)) {
			require_once('../tc_code/DBConnectionAdmin.php');

			$myDBConnection = new DBConnectionAdmin();
			if (!$myDBConnection->isError()) {
				$myerrorcode = 401;
			
				$myName = $myDBConnection->getLoginName($myAToken);
			
				if (isset($myName) and (count($myName) > 0)) {
					$workspaces = $myDBConnection->getWorkspaces($myAToken);
					if (count($workspaces) > 0) {
						$myerrorcode = 0;
					
						$myreturn = [
							'admintoken' => $myAToken,
							'name' => $myName,
							'workspaces' => $workspaces
						];
					}
				}
			}
			unset($myDBConnection);
		}

		if ($myerrorcode > 0) {
			http_response_code($myerrorcode);
		} else {
			echo(json_encode($myreturn));
		}
	}
?>
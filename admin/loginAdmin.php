<?php
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		$myreturn = [
			'admintoken' => '',
			'name' => '',
			'workspaces' => [],
			'is_superadmin' => false
		];
		$myerrorcode = 503;
		require_once('../tc_code/DBConnectionAdmin.php');

		$myDBConnection = new DBConnectionAdmin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$data = json_decode(file_get_contents('php://input'), true);
			$myName = $data["n"];
			$myPassword = $data["p"];
			
			if (isset($myName) and isset($myPassword)) {
				$myerrorcode = 402;
				$myToken = $myDBConnection->login($myName, $myPassword);
				
				if (isset($myToken) and (strlen($myToken) > 0)) {
					$myerrorcode = 403;
					$myName = $myDBConnection->getLoginName($myToken);
				
					if (isset($myName) and (strlen($myName) > 0)) {
						$myerrorcode = 406;
						$workspaces = $myDBConnection->getWorkspaces($myToken);
						$isSuperAdmin = $myDBConnection->isSuperAdmin($myToken);
						if ((count($workspaces) > 0) || $isSuperAdmin) {
							$myerrorcode = 0;
						
							$myreturn = [
								'admintoken' => $myToken,
								'name' => $myName,
								'workspaces' => $workspaces,
								'is_superadmin' => $isSuperAdmin
							];
						}
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
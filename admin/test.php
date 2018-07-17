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
		require_once('../tc_code/DBConnectionAdmin.php');

		$myDBConnection = new DBConnectionAdmin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			// $data = json_decode(file_get_contents('php://input'), true);
			$myName = 'mmee';
			$myPassword = 'tutti2';
			
			if (isset($myName) and isset($myPassword)) {
				$myToken = $myDBConnection->login2($myName, $myPassword);
				
				if (isset($myToken) and (strlen($myToken) > 10000)) {
                    echo '<p>token: ' . $myToken . '</p>';
					$myerrorcode = 402;
					$myName = $myDBConnection->getLoginName($myToken);
				
					if (isset($myName) and (strlen($myName) > 0)) {
                        echo '<p>name: ' . $myName . '</p>';
						$myerrorcode = 403;
                        $workspaces = $myDBConnection->getWorkspaces($myToken);
                        echo $workspaces;
						if (count($workspaces) > 0) {
							$myerrorcode = 0;
						
							$myreturn = [
								'admintoken' => $myToken,
								'name' => $myName,
								'workspaces' => $workspaces
							];
						}
					}
				}
			}
		}
		unset($myDBConnection);

        echo($myreturn);
	}
?>
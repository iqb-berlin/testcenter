<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

	// preflight OPTIONS-Request with CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
    require_once('../tc_code/DBConnectionAdmin.php');
    
    $myreturn = [];

	$errorCode = 503;
    // Connect
	$myDBConnection = new DBConnectionAdmin();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 401;
		// GET or POST credentials
		$data = json_decode(file_get_contents('php://input'), true);
     
		$myToken = $data["at"];
		$wsId = $data["ws"];
		if (isset($myToken)) {
			$workspaces = $myDBConnection->getWorkspaces($myToken);
			if (count($workspaces) > 0) {
				$wsIdInt = intval($wsId);
				$wsId = 0;
				foreach($workspaces as $ws) {
					if ($ws['id'] == $wsIdInt) {
						$wsId = $wsIdInt;
					}
				}
				if ($wsId > 0) {
					$myerrorcode = 0;
					// Check credentials
					$myreturn = $myDBConnection->getBookletList($wsId);
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
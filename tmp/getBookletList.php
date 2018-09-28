<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

	// preflight OPTIONS-Request with CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
    require_once('../../vo_code/DBConnectionAdmin.php');
    
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
			if ($myDBConnection->hasAdminAccessToWorkspace($myToken, $wsId)) {
				$myerrorcode = 0;
				// Check credentials
				$myreturn = $myDBConnection->getBookletList($wsId);
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
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
	$myreturn = '';

	$myerrorcode = 503;

	$myDBConnection = new DBConnectionTC();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 401;

		$data = json_decode(file_get_contents('php://input'), true);
		$auth = $data["au"];
		$resourceFileName = $data["r"];

		if (isset($auth) and isset($resourceFileName)) {
			$wsId = $myDBConnection->getWorkspaceByAuth($auth);
			if ($wsId > 0) {
				$myerrorcode = 404;
				$resourceFolder = '../vo_data/ws_' . $wsId . '/Resource';
				$path_parts = pathinfo($resourceFileName); // extract filename if path is given
				$resourceFileName = strtoupper($path_parts['basename']);

				if (file_exists($resourceFolder) and (strlen($resourceFileName) > 0)) {
					$mydir = opendir($resourceFolder);
					if ($mydir !== false) {

						while (($entry = readdir($mydir)) !== false) {
							if (strtoupper($entry) == $resourceFileName) {
								$fullfilename = $resourceFolder . '/' . $entry;
								$myerrorcode = 0;
								$myreturn = file_get_contents($fullfilename);
								break;
							}
						}
					}
				}
			}				
		}
	}    
	unset($myDBConnection);

	if ($myerrorcode > 0) {
		http_response_code($myerrorcode);
	} else {
		echo($myreturn);
	}
}
?>
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
	$myreturn = ['xml' => '', 'status' => '', 'restorepoint' => ''];

	$myerrorcode = 503;

	$myDBConnection = new DBConnectionTC();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 401;

		$data = json_decode(file_get_contents('php://input'), true);
		$auth = $data["au"];
		$unitName = $data["u"];

		if (isset($auth) and isset($unitName)) {
			$wsId = $myDBConnection->getWorkspaceByAuth($auth);
			if ($wsId > 0) {
				$myerrorcode = 404;
				$unitFolder = '../vo_data/ws_' . $wsId . '/Unit';
				if (file_exists($unitFolder) and (strlen($unitName) > 0)) {
					$mydir = opendir($unitFolder);
					if ($mydir !== false) {
						$unitName = strtoupper($unitName);

						require_once('../vo_code/XMLFile.php'); // // // // ========================
						while (($entry = readdir($mydir)) !== false) {
							$fullfilename = $unitFolder . '/' . $entry;
							if (is_file($fullfilename)) {

								$xFile = new XMLFile($fullfilename);
								if ($xFile->isValid()) {
									$uKey = $xFile->getId();
									if ($uKey == $unitName) {
										$myerrorcode = 0;
										$myreturn['xml'] = $xFile->xmlfile->asXML();
										break;
									}
								}
							}
						}
						if ($myerrorcode == 0) {
							$status = $myDBConnection->getUnitStatus($myDBConnection->getBookletId($auth), $unitName);
							if (isset($status['restorepoint'])) {
								$myreturn['restorepoint'] = $status['restorepoint'];
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
		echo(json_encode($myreturn));
	}
}
?>
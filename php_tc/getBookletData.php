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
	$myreturn = ['xml' => '', 'locked' => false, 'u' => 0];

	$myerrorcode = 503;

	$myDBConnection = new DBConnectionTC();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 401;

		$data = json_decode(file_get_contents('php://input'), true);
		$auth = $data["au"];

		if (isset($auth)) {
			$wsId = $myDBConnection->getWorkspaceByAuth($auth);
			if ($wsId > 0) {
				$myerrorcode = 404;
				$myBookletFolder = '../vo_data/ws_' . $wsId . '/Booklet';
				$bookletName = $myDBConnection->getBookletNameByAuth($auth);
				if (file_exists($myBookletFolder) and (strlen($bookletName) > 0)) {
					$mydir = opendir($myBookletFolder);
					if ($mydir !== false) {

						require_once('../vo_code/XMLFile.php'); // // // // ========================
						while (($entry = readdir($mydir)) !== false) {
							$fullfilename = $myBookletFolder . '/' . $entry;
							if (is_file($fullfilename)) {

								$xFile = new XMLFile($fullfilename);
								if ($xFile->isValid()) {
									$bKey = $xFile->getId();
									if ($bKey == $bookletName) {
										$myerrorcode = 0;
										$myreturn['xml'] = $xFile->xmlfile->asXML();
										break;
									}
								}
							}
						}
						if ($myerrorcode == 0) {
							$status = $myDBConnection->getBookletStatus($myDBConnection->getBookletId($auth));
							if (isset($status['u'])) {
								$myreturn['u'] = $status['u'];
							}
							if (isset($status['locked'])) {
								$myreturn['locked'] = $status['locked'];
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
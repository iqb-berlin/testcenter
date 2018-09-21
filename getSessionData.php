<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
} else {
	require_once('vo_code/DBConnectionSession.php');

	// *****************************************************************
	$myreturn = ['xml' => '', 'locked' => false, 'u' => 0];

	$myerrorcode = 503;

	$myDBConnection = new DBConnectionSession();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 401;

		$data = json_decode(file_get_contents('php://input'), true);
		$myToken = $data["st"];

		if (isset($myToken)) {
			$tokensplits = explode('##', $myToken);
			if (count($tokensplits) == 2) {
				$sessiontoken = $tokensplits[0];
				$bookletDBId = $tokensplits[1];

				$wsId = $myDBConnection->getWorkspaceBySessiontoken($sessiontoken);
				$bookletName = $myDBConnection->getBookletName($bookletDBId);
				if ($wsId > 0) {
					$myBookletFolder = 'vo_data/ws_' . $wsId . '/Booklet';
					if (file_exists($myBookletFolder)) {
						$mydir = opendir($myBookletFolder);

						require_once('vo_code/XMLFile.php'); // // // // ========================
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
							$status = $myDBConnection->getBookletStatus($bookletDBId);
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
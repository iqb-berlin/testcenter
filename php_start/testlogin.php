<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
} else {
	require_once('../vo_code/DBConnectionStart.php');

	// *****************************************************************

	// Booklet-Struktur: name, codes[], 
	$myreturn = '';

	$myerrorcode = 503;

	$myDBConnection = new DBConnectionStart();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 400;

		$data = json_decode(file_get_contents('php://input'), true);
		$myName = $data["n"];
		$myPassword = $data["p"];

		$hasfound = false;
		$myBooklets = [];
		$myWorkspace = '';

		if (isset($myName) and isset($myPassword)) {
			$workspaceDir = opendir('../vo_data');
			$testeefiledirprefix = '../vo_data/ws_';
			if ($workspaceDir) {

				require_once('../vo_code/XMLFileTesttakers.php'); // // // // ========================
				$myerrorcode = 0;

				while (($subdir = readdir($workspaceDir)) !== false) {
					$mysplits = explode('_', $subdir);

					if (count($mysplits) == 2) {
						if (($mysplits[0] == 'ws') && is_numeric($mysplits[1])) {
							$TesttakersDirname = $testeefiledirprefix . $mysplits[1] . '/Testtakers';
							if (file_exists($TesttakersDirname)) {
								$mydir = opendir($TesttakersDirname);
								while (($entry = readdir($mydir)) !== false) {
									$fullfilename = $TesttakersDirname . '/' . $entry;
									if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
										// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
										$xFile = new XMLFileTesttakers($fullfilename);

										if ($xFile->isValid()) {
											if ($xFile->getRoottagName()  == 'Testtakers') {
												$myBooklets = $xFile->getLoginData($myName, $myPassword);
												if (count($myBooklets['booklets']) > 0) {
													$myWorkspace = $mysplits[1];
													$hasfound = true;
													break;
												}
											}
										}
										// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
									}
								} // lesen von Verzeichnisinhalt Testtakers
							}
						}
					}
					if ($hasfound) {
						break;
					}
				} // lesen subdirs von vo_data


				if (strlen($myWorkspace) > 0) {
					$myerrorcode = 0;
					$myreturn = $myDBConnection->login(
						$myWorkspace, $myBooklets['groupname'], $myBooklets['loginname'], $myBooklets['mode'], $myBooklets['booklets']);
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
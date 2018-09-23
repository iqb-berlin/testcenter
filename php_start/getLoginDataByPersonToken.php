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

	// CODE!
	$myreturn = ['mode' => '', 'groupname' => '', 'loginname' => '', 'workspaceName' => '', 'booklets' => [], 'code' => ''];

	$myerrorcode = 503;

	$myDBConnection = new DBConnectionStart();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 401;

		$data = json_decode(file_get_contents('php://input'), true);
		$myToken = $data["pt"];

		if (isset($myToken)) {
			$myreturn = $myDBConnection->getAllBookletsByPersonToken($myToken);
			if (count($myreturn['booklets']) > 0 ) {
				$bookletfolder = '../vo_data/ws_' . $myreturn['ws'] . '/Booklet';

				if (file_exists($bookletfolder)) {
					$mydir = opendir($bookletfolder);
					$bookletlist = [];

					require_once('../vo_code/XMLFile.php'); // // // // ========================
					while (($entry = readdir($mydir)) !== false) {
						$fullfilename = $bookletfolder . '/' . $entry;
						if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {

							$xFile = new XMLFile($fullfilename);
							if ($xFile->isValid()) {
								$bKey = $xFile->getId();
								$bookletlist[$bKey] = [
										'name' => $xFile->getLabel(),
										'filename' => $entry];
							}
						}
					}
					$myerrorcode = 0;
					
					if (count($bookletlist) > 0) {
						foreach($myreturn['booklets'] as $key => $s) {
							$bookletkey = strtoupper($s['name']);
							if (isset($bookletlist[$bookletkey])) {
								$bData = $bookletlist[$bookletkey];
								$myreturn['booklets'][$key]['filename'] = $bData['filename'];
								$myreturn['booklets'][$key]['title'] = $bData['name'];
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
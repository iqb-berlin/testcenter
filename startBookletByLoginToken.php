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

	// Booklet-Struktur: name, codes[], 
	$myreturn = '';

	$myerrorcode = 503;

	$myDBConnection = new DBConnectionSession();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 401;

		$data = json_decode(file_get_contents('php://input'), true);
		$myLoginToken = $data["lt"];
		$myCode = $data["c"];
		$myBookletFilename = $data["b"];

		if (isset($myLoginToken) and isset($myBookletFilename)) {
			$wsId = $myDBConnection->getWorkspaceByLogintoken($myLoginToken);
			if ($wsId > 0) {
				$myBookletFilename = 'vo_data/ws_' . $wsId . '/Booklet' . '/' . $myBookletFilename;
				if (file_exists($myBookletFilename)) {

					$xmlfile = simplexml_load_file($myBookletFilename);
					if ($xmlfile != false) {
						$myerrorcode = 0;
						$bKey = (string) $xmlfile->Metadata[0]->ID[0];
						$bLabel = (string) $xmlfile->Metadata[0]->Name[0];
						$myreturn = $myDBConnection->start_session($myLoginToken, $myCode, $bKey, $bLabel);
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
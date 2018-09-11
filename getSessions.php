<?php
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('vo_code/DBConnectionLogin.php');

		// *****************************************************************

		// Booklet-Struktur: name, codes[], 
		$myreturn = ['ws' => '', 'sessions' => [], 'mode' => ''];

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionLogin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$data = json_decode(file_get_contents('php://input'), true);
			$myToken = $data["lt"];

			if (isset($myToken)) {
				$myreturn = $myDBConnection->getSessions($myToken);
				if (count($myreturn['sessions']) > 0 ) {
					$bookletfolder = 'vo_data/ws_' . $myreturn['ws'] . '/Booklet';

					if (file_exists($bookletfolder)) {
						$mydir = opendir($bookletfolder);
						$bookletlist = [];
						while (($entry = readdir($mydir)) !== false) {
							$fullfilename = $bookletfolder . '/' . $entry;
							if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {

								$xmlfile = simplexml_load_file($fullfilename);
								if ($xmlfile != false) {
									$bKey = strtoupper((string) $xmlfile->Metadata[0]->ID[0]);
									$bookletlist[$bKey] = [
											'name' => (string) $xmlfile->Metadata[0]->Name[0],
											'filename' => $entry];
								}
							}
						}
						$myerrorcode = 0;
						
						if (count($bookletlist) > 0) {
							foreach($myreturn['sessions'] as $key => $s) {
								$bookletkey = strtoupper($s['name']);
								if (isset($bookletlist[$bookletkey])) {
									$bData = $bookletlist[$bookletkey];
									$myreturn['sessions'][$key]['filename'] = $bData['filename'];
									$myreturn['sessions'][$key]['title'] = $bData['name'];
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
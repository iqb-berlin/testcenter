<?php
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('vo_code/DBConnectionLogin.php');
	
		// *****************************************************************

		// Booklet-Data: name, codes[], 
		$myreturn = ['ws' => '', 'booklets' => [], 'mode' => ''];

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionLogin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$data = json_decode(file_get_contents('php://input'), true);
			$myToken = $data["lt"];

			if (isset($myToken)) {
				$myreturn = $myDBConnection->getBooklets($myToken);
				if (count($myreturn['booklets']) > 0 ) {
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
							foreach($myreturn['booklets'] as $code => $booklets) {
								foreach($booklets as $bkey => $bvalue) {
									$bookletkey = $bvalue['name'];
									if (isset($bookletlist[$bookletkey])) {
										$bData = $bookletlist[$bookletkey];
										$myreturn['booklets'][$code][$bkey]['filename'] = $bData['filename'];
										$myreturn['booklets'][$code][$bkey]['title'] = $bData['name'];
									}
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
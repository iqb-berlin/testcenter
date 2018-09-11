<?php
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('vo_code/DBConnectionSession.php');

		// *****************************************************************
		$myreturn = ['xml' => '', 'status' => '', 'restorepoint' => ''];

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionSession();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$data = json_decode(file_get_contents('php://input'), true);
			$myToken = $data["st"];
			$myUnitName = $data["u"];

			if (isset($myToken)) {
				$tokensplits = explode('##', $myToken);
				if (count($tokensplits) == 2) {
					$sessiontoken = $tokensplits[0];
					$bookletDBId = $tokensplits[1];

					$wsId = $myDBConnection->getWorkspaceBySessiontoken($sessiontoken);
					if ($wsId > 0) {
						$myerrorcode = 404;
						$myUnitFolder = 'vo_data/ws_' . $wsId . '/Unit';
						if (file_exists($myUnitFolder)) {
							$mydir = opendir($myUnitFolder);
							while (($entry = readdir($mydir)) !== false) {
								$fullfilename = $myUnitFolder . '/' . $entry;
								if (is_file($fullfilename)) {

									$xmlfile = simplexml_load_file($fullfilename);
									if ($xmlfile != false) {
										if (strtoupper((string) $xmlfile->Metadata[0]->ID[0]) == strtoupper($myUnitName)) {
											$myerrorcode = 0;
											$myreturn['xml'] = $xmlfile->asXML();
											break;
										}
									}
								}
							}
							if ($myerrorcode == 0) {
								$status = $myDBConnection->getUnitStatus($bookletDBId, $myUnitName);
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
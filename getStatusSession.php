<?php
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('tc_code/DBConnectionSession.php');

		// *****************************************************************
		$myreturn = ['xml' => '', 'status' => ''];

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionSession();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$data = json_decode(file_get_contents('php://input'), true);
			$myToken = $data["st"];

			if (isset($myToken)) {
				$tokensplits = explode('##', $myToken);
				if (count($tokensplits) == 3) {
					$sessiontoken = $tokensplits[0];
					$code = $tokensplits[1];
					$bookletId = $tokensplits[2];

					$wsId = $myDBConnection->getWorkspaceBySessiontoken($sessiontoken);
					if ($wsId > 0) {
						$myBookletFolder = 'tc_data/ws_' . $wsId . '/Booklet';
						if (file_exists($myBookletFolder)) {
							$mydir = opendir($myBookletFolder);
							while (($entry = readdir($mydir)) !== false) {
								$fullfilename = $myBookletFolder . '/' . $entry;
								if (is_file($fullfilename)) {

									$xmlfile = simplexml_load_file($fullfilename);
									if ($xmlfile != false) {
										$myerrorcode = 0;
										if (strtoupper((string) $xmlfile->Metadata[0]->ID[0]) == $bookletId) {
											$myerrorcode = 0;
											$myreturn['xml'] = $xmlfile->asXML();
											break;
										}
									}
								}
							}
							if ($myerrorcode == 0) {
								$myreturn['status'] = $myDBConnection->getBookletStatus($sessiontoken, $bookletId);
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
<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('../../vo_code/DBConnectionAdmin.php');

		// *****************************************************************

		$myreturn = '';

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionAdmin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$data = json_decode(file_get_contents('php://input'), true);
			$myToken = $data["at"];
			$wsId = $data["ws"];
			if (isset($myToken)) {
				if ($myDBConnection->hasAdminAccessToWorkspace($myToken, $wsId)) {
					// **********************************************************
					$myerrorcode = 0;

					$workspaceDirName = '../../vo_data/ws_' . $wsId;
					if (file_exists($workspaceDirName)) {
						$errorcount = 0;
						$successcount = 0;
						foreach($data["f"] as $fileToDelete) {
							$mysplits = explode('::', $fileToDelete);
							if (count($mysplits) == 2) {
								if (unlink($workspaceDirName . '/' . $mysplits[0] . '/' . $mysplits[1])) {
									$successcount = $successcount + 1;
								} else {
									$errorcount = $errorcount + 1;
								}
							}
						}
						if ($errorcount > 0) {
							$myreturn = 'e:Konnte ' . $errorcount . ' Dateien nicht löschen.';	
						} else {
							if ($successcount == 1) {
								$myreturn = 'Eine Datei gelöscht.';
							} else {
								$myreturn = 'Erfolgreich ' . $successcount . ' Dateien gelöscht.';	
							}
						}
					} else {
						$myreturn = 'e:Workspace-Verzeichnis nicht gefunden.';
					}
					// **********************************************************
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
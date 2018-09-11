<?php
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('../vo_code/DBConnectionAdmin.php');

		// *****************************************************************

		$myreturn = [];

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionAdmin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$myToken = $_GET['at'];
			$wsId = $_GET['ws'];
			if (isset($myToken)) {
				$workspaces = $myDBConnection->getWorkspaces($myToken);
				if (count($workspaces) > 0) {
					$wsIdInt = intval($wsId);
					$wsId = 0;
					foreach($workspaces as $ws) {
						if ($ws['id'] == $wsIdInt) {
							$wsId = $wsIdInt;
						}
					}

					if ($wsId > 0) {
						$myerrorcode = 404;

						$workspaceDirName = '../vo_data/ws_' . $wsId;
						$path_parts = pathinfo($_GET['t']);
						$subFolder = $path_parts['basename'];
						$path_parts = pathinfo($_GET['fn']);
						$filename = $path_parts['basename'];
						
						$fullfilename = $workspaceDirName . '/' . $subFolder . '/' . $filename;
						if (file_exists($fullfilename)) {
							$myerrorcode = 0;

							header('Content-Description: File Transfer');
							if ($subFolder == 'Resource') {
								header('Content-Type: application/octet-stream');
							} else {
								header('Content-Type: text/xml');
							}
							header('Content-Disposition: attachment; filename="' . $filename . '"');
							header('Expires: 0');
							header('Cache-Control: must-revalidate');
							header('Pragma: public');
							header('Content-Length: ' . filesize($fullfilename));
							readfile($fullfilename);
						}
					}
				}
			}
		}        
		unset($myDBConnection);

		if ($myerrorcode > 0) {
			http_response_code($myerrorcode);
		}
	}
?>
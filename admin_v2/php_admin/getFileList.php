<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT
// duplication!??!
	// preflight OPTIONS-Request bei CORS
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
		exit();
	} else {
		require_once('../../vo_code/DBConnectionAdmin.php');
		require_once('../../vo_code/FilesFactory.php');

		// *****************************************************************

		$myreturn = [];

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionAdmin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;

			$data = json_decode(file_get_contents('php://input'), true);
			$myToken = $data["at"];
			$wsId = $data["ws"];
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
						$myerrorcode = 0;

						$workspaceDirName = '../../vo_data/ws_' . $wsId;
						if (file_exists($workspaceDirName)) {
							$workspaceDir = opendir($workspaceDirName);
							while (($subdir = readdir($workspaceDir)) !== false) {
								if (($subdir !== '.') && ($subdir !== '..')) {
									$fullsubdirname = $workspaceDirName . '/' .  $subdir;
									if (is_dir($fullsubdirname)) {
										$mydir = opendir($fullsubdirname);
										while (($entry = readdir($mydir)) !== false) {
											$fullfilename = $fullsubdirname . '/' . $entry;
											if (is_file($fullfilename)) {
												$rs = new ResourceFile($entry, filemtime($fullfilename), filesize($fullfilename));

												array_push($myreturn, [
													'filename' => $rs->getFileName(),
													'filesize' => $rs->getFileSize(),
													'filesizestr' => $rs->getFileSizeString(),
													'filedatetime' => $rs->getFileDateTime(),
													'filedatetimestr' => $rs->getFileDateTimeString(),
													'type' => $subdir,
													'typelabel' => $subdir
												]);
											}
										}
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

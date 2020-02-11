<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
} else {

	$myreturn = [];

	$workspaceDir = opendir('../vo_data');
	$syscheckfiledirprefix = '../vo_data/ws_';
	if ($workspaceDir) {

		require_once('../vo_code/XMLFileSysCheck.php'); // // // // ========================

		while (($subdir = readdir($workspaceDir)) !== false) {
			$mysplits = explode('_', $subdir);

			if (count($mysplits) == 2) {
				if (($mysplits[0] == 'ws') && is_numeric($mysplits[1])) {
					$syscheckDirname = $syscheckfiledirprefix . $mysplits[1] . '/SysCheck';
					if (file_exists($syscheckDirname)) {
						$mydir = opendir($syscheckDirname);
						while (($entry = readdir($mydir)) !== false) {
							$fullfilename = $syscheckDirname . '/' . $entry;
							if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
								// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
								$xFile = new XMLFileSysCheck($fullfilename);

								if ($xFile->isValid()) {
									if ($xFile->getRoottagName()  == 'SysCheck') {
										array_push($myreturn, ['id' => urlencode($fullfilename), 
										'label' => $xFile->getLabel(),
										'description' => $xFile->getDescription()]);
									}
								}
								// &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
							}
						} // lesen von Verzeichnisinhalt SysCheck
					}
				}
			}
		} // lesen subdirs von vo_data
	}				

	echo(json_encode($myreturn));
}
?>

<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
} else {

	$data = json_decode(file_get_contents('php://input'), true);
	$configFileNameCoded = $data["c"];

	if (isset($configFileNameCoded)) {
		$configFileName = urldecode($configFileNameCoded);
		if (file_exists($configFileName)) {
			require_once('../vo_code/XMLFileSysCheck.php'); // // // // ========================

			$xFile = new XMLFileSysCheck($configFileName);

			if ($xFile->isValid()) {
				if ($xFile->getRoottagName()  == 'SysCheck') {
					$myreturn = $xFile->getUnitData();
				}
			}
		}
	}

	echo(json_encode($myreturn));
}
?>

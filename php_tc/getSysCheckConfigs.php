<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
} else {

	// *****************************************************************
	require_once('../vo_code/SysCheck.php');

	echo(json_encode(SysCheck::getConfigList()));
}
?>
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
	$uId = $data["u"];

	require_once('../vo_code/SysCheck.php');

	$myreturn = SysCheck::getUnitData($uId);

	echo(json_encode($myreturn));
}
?>
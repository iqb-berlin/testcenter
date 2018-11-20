<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

// preflight OPTIONS-Request bei CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
	exit();
} else {
	require_once('../../vo_code/DBConnectionSuperadmin.php');

	// *****************************************************************

	// Booklet-Struktur: name, codes[], 
	$myreturn = '';

	$myerrorcode = 503;

	$myDBConnection = new DBConnectionSuperAdmin();
	if (!$myDBConnection->isError()) {
		$myerrorcode = 401;
		
		$data = json_decode(file_get_contents('php://input'), true);
		$adminToken = $data["t"];
		$aboutText = $data["text"];
		
		if (isset($adminToken) and isset($aboutText)) {
      if($myDBConnection->isSuperAdmin($adminToken)) {
				$filename = "../../php_start/about.txt";
				$myreturn = file_put_contents($filename, $aboutText);
				$myerrorcode = 0;
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
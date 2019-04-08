<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

  if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit();
  } else {
    $myreturn = [];
    require_once('../../vo_code/DBConnectionAdmin.php');
    $errorcode = 503;

    $myDBConnection = new DBConnectionAdmin();
    if (!$myDBConnection->isError()) {

      $errorcode = 401;

      try {
				$authToken = json_decode($_SERVER['HTTP_AUTHTOKEN'], true);
				$myToken = $authToken['at'];
				$wsId = $authToken['ws'];
			} catch (Exception $ex) {
				$errorcode = 500;
				$myreturn = 'e: ' . $ex->getMessage();
			}

			if (isset($myToken)) {
        if ($myDBConnection->hasAdminAccessToWorkspace($myToken, $wsId)) {
          $errorcode = 0;
          $data = json_decode(file_get_contents('php://input'), true);
          $myreturn = $myDBConnection->getLogs($wsId, $data["g"]);
        }
      }
    } 
    $errorcode = 0;
  }

  unset($myDBConnection);
  if ($errorcode > 0) {
    http_response_code($errorcode);
  } else {
    echo(json_encode($myreturn));
  }

?>
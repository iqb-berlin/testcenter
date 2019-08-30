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

      $data = json_decode(file_get_contents('php://input'), true);
      $myToken = $data["at"];
			$wsId = $data["ws"];
			if (isset($myToken)) {
        if ($myDBConnection->hasAdminAccessToWorkspace($myToken, $wsId)) {
          $errorcode = 0;
          $groups = $data["g"];
          foreach($myDBConnection->getLogs($wsId) as $booklet) {
            if (in_array($booklet['groupname'], $groups)) {
              array_push($myreturn, $booklet);
            }
          }
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
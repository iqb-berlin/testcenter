<?php
  if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit();
  } else {
    $myreturn = [];
    require_once('../vo_code/DBConnectionAdmin.php');
    $errorcode = 503;

    $myDBConnection = new DBConnectionAdmin();
    if (!$myDBConnection->isError()) {
      $errorcode = 401;
      $data = json_decode(file_get_contents('php://input'), true);
      $admin_token = $data["at"];
      $workspace_id = $data["ws"];
      if (isset($workspace_id) && isset($admin_token)) {
        $myreturn = $myDBConnection->showStats($admin_token, $workspace_id);
        $errorcode = 0;
      }
    }
  }        

  unset($myDBConnection);
  if ($errorcode > 0) {
    http_response_code($errorcode);
  } else {
    echo(json_encode($myreturn));
  }

?>

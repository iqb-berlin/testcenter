<?php
  if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit();
  } else {
    $myreturn = [];
    require_once('../tc_code/DBConnectionAdmin.php');
    $errorcode = 503;

    $myDBConnection = new DBConnectionAdmin();
    if (!$myDBConnection->isError()) {
      $errorcode = 401;
      $data = json_decode(file_get_contents('php://input'), true);
      $admin_token = $data["at"];
      $workspace_id = $data["ws"];
      if (isset($workspace_id) && isset($admin_token)) {
        array_push($myreturn, $myDBConnection->groupName($workspace_id));
        array_push($myreturn, $myDBConnection->testsStarted($admin_token, $workspace_id));
        array_push($myreturn, $myDBConnection->responsesGiven($workspace_id));
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

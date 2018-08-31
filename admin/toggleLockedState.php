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
      $workspace_id = $data["ws"];

      if (isset($workspace_id)) {
        $data = $myDBConnection->toggleLockedState($workspace_id)[];
        // check in xml for the strings that are lockeable -> done in another file, check that
        // then, compare them and just change their status in sql with the ones that you found
        // this is not seen in UI, it's only toggled by a radio button at the group level in monitoring view
        $myreturn = $data;
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
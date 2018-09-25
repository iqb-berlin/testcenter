<?php

function showXMLFiles($wsId) {
  $return = [];

  if(is_numeric($wsId)) {
    if($wsId > 0) {
    $sanitizedwsId = intval($wsId);
    $myGroupCount = 1;

    $TesttakersDirname = __DIR__ . '/../vo_data/ws_' . $sanitizedwsId . '/Testtakers';

      if (file_exists($TesttakersDirname)) {
        $filenames = scandir($TesttakersDirname);
        $files = [];
        foreach ($filenames as $key => $value) {
          if(strtoupper(substr($value, -4)) === '.XML') {
            array_push($files, $TesttakersDirname . '/' . $value);
          }
        }
      }
    }
  }
  return $files;
}

require_once('../vo_code/DBConnectionAdmin.php');
$errorcode = 503;
$DBConnection = new DBConnectionAdmin();


if (!$DBConnection->isError()) {

  $errorcode = 401;
  $adminToken = $_GET["at"];
  $workspaceId = $_GET["ws"];

  if($DBConnection->hasAdminAccessToWorkspace($adminToken, $workspaceId)===true) {
    $errorcode = 204;
    $files = showXMLFiles($workspaceId);

    $dataStructure = [];



    foreach ($files as $key => $value) {
      $fileContent = file_get_contents($value);
      $file = simplexml_load_file($value);
      if($file !== false) {

        if ($file->getName() == 'Testtakers') {

          // $p = xml_parser_create();

          // xml_parse_into_struct($p, $fileContent, $vals, $index);

          // xml_parser_free($p);
          
          // print_r($vals);


          foreach ($file->children() as $group) {
            array_push($dataStructure, $group['name']);
            if ($group->getName() == 'Group') {

              echo "\n" . $group['name'] . "\n";

              foreach ($group->children() as $login) {
                
                if($login->getName() == 'Login') { 
                    echo "--- " . $login['name'] . "\n";

                  foreach ($login->children() as $booklet) {
                    
                    if($booklet->getName() == 'Booklet') {

                      if(isset($booklet['codes'])) {
                        $bookletCodes = explode(" ", (string) $booklet['codes']);
                        echo "------ " . $booklet['codes'] . "\n";

                        foreach($bookletCodes as $bookletCode) {

                          if(strlen($bookletCode) > 0) {

                            if(!in_array($bookletCode, $testCodes)) {

                            }           
                          }
                        }
                      }
                    }
                  }
                }
              }

            }
          }
        }
      }
    }
    // print_r($dataStructure);

  } else if (isset($workspaceId) && isset($adminToken)) {
    $errorcode = 401;
    echo "unauthorized";
  } else {
    echo 'credentials not set';
  }  

} 

?>


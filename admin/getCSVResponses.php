<?php

function addToResult($resultArray, $loginName, $code, $booklet) {
  // place here getAllResponses()
  $myDBConnection = new DBConnectionAdmin();
  $return = $myDBConnection->getAllResponses($resultArray, $loginName, $code, $booklet);
}

function getGroupData($wsId) {
  $return = [];

        
  if(is_numeric($wsId)) {
    if($wsId > 0) {
    $sanitizedwsId = intval($wsId);
    $myGroupCount = 1;

    $TesttakersDirname = __DIR__.'/../vo_data/ws_' . $sanitizedwsId . '/Testtakers';
    error_log($TesttakersDirname);
    if (file_exists($TesttakersDirname)) {

      $testTakersDirectoryHandle = opendir($TesttakersDirname);

      // reading file by file, $filename stores the name of the next file in the directory
      while (($filename = readdir($testTakersDirectoryHandle))) { 

        // checking if files still exist ahead  
        if ($filename !== false) {      

        $fullfilename = $TesttakersDirname . '/' . $filename; // complete file path
        
          // checking if there is a file at the full file path and if it is an .xml
          if (is_file($fullfilename) && (strtoupper(substr($filename, -4)) == '.XML')) {
          $xmlfile = simplexml_load_file($fullfilename);
          
          // if the xml file has loaded successfully into $xmlfile
          if ($xmlfile != false) {

            $rootTagName = $xmlfile->getName();
            if ($rootTagName == 'Testtakers') {

              

            // go through each xml tag that is a direct child of <Testtakers>
            foreach($xmlfile->children() as $group) { 
              if ($group->getName() == 'Group') {
                $obj = ["groupname" => "",
                        "people" => [] 
                ];
                if (isset($group['name'])) {
                  $obj["groupname"] = (string) $group['name'];
                } else {
                  $obj["groupname"] = "group " . $myGroupCount;
                  $myGroupCount += 1;
                }
                // group xml to get login names as people mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
                foreach($group->children() as $login) {
                  if($login->getName() == "Login") {

                    // Collecting all codes
                    $myCodes = [];
                    foreach($login->children() as $booklet) {

                      if($booklet->getName() == "Booklet") {
                        if(isset($booklet['codes'])) {
                          $myBookletCodes = explode(" ", (string) $booklet['codes']);
                          foreach($myBookletCodes as $bookletCode) {
                            if(strlen($bookletCode) > 0) {
                              if(!in_array($bookletCode, $myCodes)) {
                                array_push($myCodes, $bookletCode);
                              }
                            }
                          }
                        }
                      }
                    }
                    
                    foreach($login->children() as $booklet) {
                      $myBookletName = strtoupper((string) $booklet);
                      if(count($myCodes) > 0) {
                        if(isset($booklet['codes'])) {
                          $myCodesString = trim((string) $booklet['codes']);
                          if(strlen($myCodesString) > 0) {
                            $myBookletCodes = explode(" ", $myCodesString);
                            foreach($myBookletCodes as $code) {
                              if(strlen($code) > 0) {
                                addToResult($return, (string) $login['name'], $code, $myBookletName);
                              }
                            }  
                          } else {
                            foreach($myCodes as $code) {
                              addToResult($return, (string) $login['name'], $code, $myBookletName);
                            }
                          }
                        } else {
                          foreach($myCodes as $code) {
                            addToResult($return, (string) $login['name'], $code, $myBookletName);
                          }
                        }
                      } else {
                        addToResult($return, (string) $login['name'], $code, $myBookletName);
                      }

                    }
                    //mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
                  }
                }
                // ends here
                // if($rso){

                // } else {
                //   array_push($return, $obj);
                // }

              }
            }


            }
          } else { 
            error_log('Error: There was no file found!');
          }
          } else { 
          error_log('Error: There might not be a file there or it is not of .xml format!');
          }
        } else {
        break;
        // if there are no more files in the folder then exit the while loop
        }
      }
    } else { 
      error_log('Error: Folder does not exist!');
    }
    } else {
    error_log('Error: Workspace ID is not valid / Might not be a number!');
    }
  } else {
    error_log('Error: Workspace ID is not a number');
  }
  return $return;
  }

header("Content-type: text/plain, charset=utf-8");
header("Content-Disposition: attachment; filename=file.csv");
header("Pragma: no-cache");
header("Expires: 0");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
  exit();
} else {

  $myreturn = [];
  require_once('../vo_code/DBConnectionAdmin.php');
  $errorcode = 503;

  $myDBConnection = new DBConnectionAdmin();
  if (!$myDBConnection->isError()) {
    $errorcode = 401;

    $admin_token = $_GET["at"];
    $workspace_id = $_GET["ws"];
    $groups = $_GET["groups"];

    if (isset($workspace_id) && isset($admin_token) && isset($groups)) {
      if($myDBConnection->hasAdminAccessToWorkspace($admin_token, $workspace_id)===true) {
        $reportData = $myDBConnection->responsesGiven($workspace_id, $groups);
        $csvFilePath = "temp/" . uniqid('', true) . '.csv';

        $fp = fopen($csvFilePath, 'w');

        foreach ($reportData as $fields) {
          fputcsv($fp, $fields, ';');
        }


        fclose($fp);
        $csvFileContent = file_get_contents($csvFilePath);
        $csvFileContent = iconv("UTF-8", "WINDOWS-1252", $csvFileContent);
        echo $csvFileContent;
        unlink($csvFilePath);
        $errorcode = 0;
      }
    }
  }
       

unset($myDBConnection);
if ($errorcode > 0) {
  http_response_code($errorcode);
  }
}
?>

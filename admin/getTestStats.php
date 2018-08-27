<?php
function getGroupData($wsId) {
  $return = [];

        
  if(is_numeric($wsId)) {
    if($wsId > 0) {
    $sanitizedwsId = intval($wsId);
    $myGroupCount = 1;

    $TesttakersDirname = __DIR__.'/../tc_data/ws_' . $sanitizedwsId . '/Testtakers';
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
                        "sessions" => [] 
                ];
                if (isset($group['name'])) {
                  $obj["groupname"] = (string) $group['name'];
                } else {
                  $obj["groupname"] = "group " . $myGroupCount;
                  $myGroupCount += 1;
                }
                // group xml to get login names as sessions mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
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
                      if(count($myCodes) > 0) {
                        if(isset($booklet['codes'])) {
                          $myBookletString = (string) $booklet['codes'];
                          $myBookletCodes = explode(" ", trim($myBookletString));
                          if(count($myBookletCodes) > 0) {
                            foreach($myBookletCodes as $code) {
                              if(strlen($code) > 0) {
                                array_push($obj["sessions"], (string) $login['name'] . "##" . $code . "##" . (string) $booklet);
                              }

                            }  
                          } else {
                            foreach($myCodes as $code) {
                              array_push($obj["sessions"], (string) $login['name'] . "##" . $code . "##" . (string) $booklet);
                            }
                          }
                        } else {
                          foreach($myCodes as $code) {
                            array_push($obj["sessions"], (string) $login['name'] . "##" . $code . "##" . (string) $booklet);
                          }
                        }
                      } else {
                        array_push($obj["sessions"], (string) $login['name'] . "##" . "" . "##" . (string) $booklet);
                      }

                    }
                    //mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
                  }
                }
                // ends here
                array_push($return, $obj);
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
        $myreturn = getGroupData($workspace_id);
        // array_push($myreturn, $myDBConnection->testsStarted($admin_token, $workspace_id));
        // array_push($myreturn, $myDBConnection->responsesGiven($workspace_id));

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

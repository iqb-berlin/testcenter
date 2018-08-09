<?php
  function getDetailedUnits($wsId) {
    $Units = [];
    if(is_numeric($wsId)) {
      if($wsId > 0) {
        $sanitizedwsId = intval($wsId);

        $UnitDirname = __DIR__.'/../tc_data/ws_' . $sanitizedwsId . '/Unit';
        error_log($UnitDirname);
        if (file_exists($UnitDirname)) {

          $UnitDirectoryHandle = opendir($UnitDirname);

          // reading file by file, $filename stores the name of the next file in the directory
          while (($filename = readdir($UnitDirectoryHandle))) { 

              // checking if files still exist ahead  
              if ($filename !== false) {             

                $fullfilename = $UnitDirname . '/' . $filename; // 
                  if (is_file($fullfilename) && (strtoupper(substr($filename, -4)) == '.XML')) {
                    $xmlfile = simplexml_load_file($fullfilename);

                    if ($xmlfile != false) {

                      $rootTagName = $xmlfile->getName();
                      if ($rootTagName == 'Unit') {

                        foreach($xmlfile->children() as $directChildOfUnit) { 
                          if ($directChildOfUnit->getName() == 'Metadata') {
                            foreach($directChildOfUnit->children() as $tt) {
                                if($tt->getName() == 'ID') {
                                  array_push($Units, $directChildOfUnit->children());
                                }
                              }
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
    return $Units;
  }

  if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {

    require_once('../tc_code/DBConnectionAdmin.php');
		$myerrorcode = 503;

		$myDBConnection = new DBConnectionAdmin();
		if (!$myDBConnection->isError()) {

      $myerrorcode = 401;
      $receivedVariables = json_decode(file_get_contents('php://input'), true);

      if(isset($receivedVariables['at']) && isset($receivedVariables['ws'])) {
        $token = $receivedVariables['at'];
        if (is_numeric($receivedVariables['ws'])) {
          $workspace = intval($receivedVariables['ws']);
        }        
        if($myDBConnection->hasAdminAccessToWorkspace($token, $workspace)) {

          $myreturn = array();
          $myreturn = getDetailedUnits($workspace);
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
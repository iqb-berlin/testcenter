<?php
  function getNumberofUnitsOnWorkspace($wsId) {
    $numberofUnits = 0;
    if(is_numeric($wsId)) {
      if($wsId > 0) {
        $sanitizedwsId = intval($wsId);

        $unitDirname = __DIR__.'/../tc_data/ws_' . $sanitizedwsId . '/Unit';
        error_log($unitDirname);
        if (file_exists($unitDirname)) {

          $unitsDirectoryHandle = opendir($unitDirname);

          // reading file by file, $filename stores the name of the next file in the directory
          while (($filename = readdir($unitsDirectoryHandle))) { 

              // checking if files still exist ahead  
              if ($filename !== false) {             

                $fullfilename = $unitDirname . '/' . $filename; // complete file path
                
                  // checking if there is a file at the full file path and if it is an .xml
                  if (is_file($fullfilename) && (strtoupper(substr($filename, -4)) == '.XML')) {
                    $xmlfile = simplexml_load_file($fullfilename);
                    
                    // if the xml file has loaded successfully into $xmlfile
                    if ($xmlfile != false) {
                      $numberofUnits = $numberofUnits + 1;

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
    return $numberofUnits;
  }

  if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {

    require_once('../tc_code/DBConnectionAdmin.php');
   // see meeee
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
          $myreturn["howManyUnits"] = getnumberofUnitsOnWorkspace($workspace);
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
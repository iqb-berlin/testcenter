<?php
  function getNumberofRegisteredUsersOnWorkspace($wsId) {
    $numberofRegisteredUsers = 0;
    if(is_numeric($wsId)) {
      if($wsId > 0) {
        $sanitizedwsId = intval($wsId);

        $TesttakersDirname = 'tc_data/ws_' . $sanitizedwsId . '/Testtakers';
        if (file_exists($TesttakersDirname)) {

          $testTakersDirectoryHandle = opendir($TesttakersDirname);
          // reading file by file
          while (($filename = readdir($testTakersDirectoryHandle))) {
            // checking it every time such that each file is processed
              if ($filename !== false) { 
                // 
                $fullfilename = $TesttakersDirname . '/' . $filename;
                echo '<br>' . $fullfilename;
                  if (is_file($fullfilename) && (strtoupper(substr($filename, -4)) == '.XML')) {
                    $xmlfile = simplexml_load_file($fullfilename);

                    if ($xmlfile != false) {
                      $rootTagName = $xmlfile->getName();
                      if ($rootTagName == 'Testtakers') {
                        foreach($xmlfile->children() as $group) { 
                          if ($group->getName() == 'Group') {
                            $notBefore = '';
                            if (isset($group['notbefore'])) {
                              $notBefore = (string) $group['notbefore'];
                            }
                            $notAfter = '';
                            if (isset($group['notafter'])) {
                              $notAfter = (string) $group['notafter'];
                            }
                            if (isset($group['mode'])) {
                              foreach($group->children() as $tt) {
                                $numberofRegisteredUsers = $numberofRegisteredUsers + 1;
                              }
                            }
                          }
                        }
                      }
                    } else { 
                      echo ('Error: There was no file found!');
                    }
                  } else { 
                    echo ('Error: There might not be a file there or it is not of .xml format!');
                  }
              } else {
                break;
                // if there are no more files in the folder then exit the while loop
              }
          }
        } else { 
          echo ('Error: Folder does not exist!');
        }
      } else {
        echo('Error: Workspace ID is not valid / Might not be a number!');
      }
    } else {
      echo('Error: Workspace ID is not a number');
    }
    return $numberofRegisteredUsers;
  }

  if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {

		require_once('tc_code/DBConnectionLogin.php');

		$myerrorcode = 503;

		$myDBConnection = new DBConnectionLogin();
		if (!$myDBConnection->isError()) {
			$myerrorcode = 401;
    
			// $data = json_decode(file_get_contents('php://input'), true);
      // $myWorkspace = $data["ws"];
      $myreturn = getNumberofRegisteredUsersOnWorkspace(19);
      $myerrorcode = -1;
    } 

    unset($myDBConnection);
     
    if ($myerrorcode > 0) {
      http_response_code($myerrorcode);
    } else {
      echo(json_encode($myreturn));
    }
  }
?>
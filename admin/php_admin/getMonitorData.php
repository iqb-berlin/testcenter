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

          $testTakerFilesFolder = '../../vo_data/ws_' . $wsId . '/Testtakers';
          if (file_exists($testTakerFilesFolder)) {
            $ttDir = opendir($testTakerFilesFolder);
            if ($ttDir !== false) {
              require_once('../../vo_code/XMLFileTesttakers.php'); // // // // ========================
              $errorcode = 0;

              $preparedBooklets = [];
              while (($entry = readdir($ttDir)) !== false) {
                $fullfilename = $testTakerFilesFolder . '/' . $entry;

                if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
                  // &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
                  $xFile = new XMLFileTesttakers($fullfilename);

                  if ($xFile->isValid()) {
                    if ($xFile->getRoottagName()  == 'Testtakers') {
                      foreach($xFile->getAllTesttakers() as $prepared) {
                        $localGroupName = $prepared['groupname'];
                        $localLoginData = $prepared;
                        // ['groupname' => string, 'loginname' => string, 'code' => string, 'booklets' => string[]]                            
                        if (!isset($preparedBooklets[$localGroupName])) {
                          $preparedBooklets[$localGroupName] = [];
                        }
                        array_push($preparedBooklets[$localGroupName], $localLoginData);
                        // error_log($prepared['groupname'] . '/' . $prepared['loginname']);

                      }
                      unset($prepared);
                    }
                  }
                }
              } // reading testtaker files


              $keyedReturn = [];
              // error_log(print_r($preparedBooklets, true));
              // !! no cross checking, so it's not checked whether a prepared booklet is started or a started booklet has been prepared
              foreach($preparedBooklets as $group => $preparedData) {
                $alreadyCountedLogins = [];
                foreach($preparedData as $pd) {
                  // ['groupname' => string, 'loginname' => string, 'code' => string, 'booklets' => string[]]                            
                  if (!isset($keyedReturn[$group])) {
                    $keyedReturn[$group] = [
                      'groupname' => $group,
                      'loginsPrepared' => 0,
                      'personsPrepared' => 0,
                      'bookletsPrepared' => 0,
                      'bookletsStarted' => 0,
                      'bookletsLocked' => 0
                    ];
                  }
                  if (!in_array($pd['loginname'], $alreadyCountedLogins)) {
                    array_push($alreadyCountedLogins, $pd['loginname']);
                    $keyedReturn[$group]['loginsPrepared'] += 1;
                  }
                  $keyedReturn[$group]['personsPrepared'] += 1;
                  $keyedReturn[$group]['bookletsPrepared'] += count($pd['booklets']);
                }
              } // counting prepared
              foreach($myDBConnection->getBookletsStarted($wsId) as $b) {
                // groupname, loginname, code, bookletname, locked
                if (!isset($keyedReturn[$b['groupname']])) {
                  $keyedReturn[$b['groupname']] = [
                    'groupname' => $b['groupname'],
                    'loginsPrepared' => 0,
                    'personsPrepared' => 0,
                    'bookletsPrepared' => 0,
                    'bookletsStarted' => 0,
                    'bookletsLocked' => 0
                  ];
                }
                $keyedReturn[$b['groupname']]['bookletsStarted'] += 1;
                if ($b['locked'] === '1') {
                  $keyedReturn[$b['groupname']]['bookletsLocked'] += 1;
                }
              }
            }

            // get rid of the key
            foreach($keyedReturn as $group => $groupData) {
              array_push($myreturn, $groupData);
            }
          } 
        }
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
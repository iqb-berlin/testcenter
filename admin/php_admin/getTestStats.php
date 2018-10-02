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
    require_once('../../vo_code/XMLFileTesttakers.php');

    $errorcode = 503;

    $myDBConnection = new DBConnectionAdmin();
    if (!$myDBConnection->isError()) {

      $errorcode = 401;
      $data = json_decode(file_get_contents('php://input'), true);
      $admin_token = $data["at"];
      $workspace_id = $data["ws"];
      $responsesGivenOnly = $data["rso"];

      if (isset($workspace_id) && isset($admin_token)) {
        if ($myDBConnection->hasAdminAccessToWorkspace($admin_token, $workspace_id)) {
          $sanitizedwsId = intval($wsId);
          $TesttakersDirname = '../../vo_data/ws_' . $sanitizedwsId . '/Testtakers';

          // get XML-Data
          $bookletStats_XML = []; // groupname -> count
          if (file_exists($TesttakersDirname)) {
            $testTakersDirectoryHandle = opendir($TesttakersDirname);
            if ($testTakersDirectoryHandle !== false) {
              while (($filename = readdir($testTakersDirectoryHandle))) {
                if (is_file($fullfilename) && (strtoupper(substr($filename, -4)) == '.XML')) {
                  $xFile = new XMLFileTesttakers($TesttakersDirname . '/' . $filename);
                  foreach($xFile->getAllTesttakers() as $tt) {
                    // 'groupname' => string, 'loginname' => string, 'code' => string, 'booklets' => string[]]
                    if (!isset($bookletStats_XML[$tt['groupname']])) {
                      $bookletStats_XML[$tt['groupname']] = 0;
                    }
                    foreach($tt['booklets'] as $booklet) {
                      $bookletStats_XML[$tt['groupname']] += 1;
                    }
                  }
                }
              }
            }
      
            // get DB-Data started booklets
            $bookletStats_Started = [];
            foreach($myDBConnection->getBookletsStarted($workspace_id) as $bData) {
              if (!isset($bookletStats_Started[$bData['groupname']])) {
                $bookletStats_Started[$bData['groupname']] = 1;
              } else {
                $bookletStats_Started[$bData['groupname']] += 1;
              }
            }
        
            // get DB-Data booklets with responses
            $bookletStats_ResponsesGiven = [];
            foreach($myDBConnection->getBookletsResponsesGiven($workspace_id) as $bData) {
              if (!isset($bookletStats_ResponsesGiven[$bData['groupname']])) {
                $bookletStats_ResponsesGiven[$bData['groupname']] = 1;
              } else {
                $bookletStats_Started[$bData['groupname']] += 1;
              }
            }

            // +++++++++++++++++++++++++++++++
            foreach($bookletStats_XML as $groupname => $bookletCount) {
              $counts = [
                "name" => $groupname,
                "testsTotal" => $bookletCount, 
                "testsStarted" => 0,
                "responsesGiven" => 0
              ];
              if (isset($bookletStats_Started[$groupname])) {
                $counts['testsStarted'] = $bookletStats_Started[$groupname];
              }
              if (isset($bookletStats_ResponsesGiven[$groupname])) {
                $counts['responsesGiven'] = $bookletStats_ResponsesGiven[$groupname];
              }

              array_push($myreturn, $counts);
            }
          }

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
  }

?>

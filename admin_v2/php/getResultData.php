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

			try {
				$authToken = json_decode($_SERVER['HTTP_AUTHTOKEN'], true);
				$myToken = $authToken['at'];
				$wsId = $authToken['ws'];
			} catch (Exception $ex) {
				$errorcode = 500;
				$myreturn = 'e: ' . $ex->getMessage();
			}

      if (isset($myToken)) {
        if ($myDBConnection->hasAdminAccessToWorkspace($myToken, $wsId)) {
          $errorcode = 0;
          $keyedReturn = [];

          foreach($myDBConnection->getResultsCount($wsId) as $b) {
            // groupname, loginname, code, bookletname, num_units
            if (!isset($keyedReturn[$b['groupname']])) {
              $keyedReturn[$b['groupname']] = [
                'groupname' => $b['groupname'],
                'bookletsStarted' => 1,
                'num_units_min' => $b['num_units'],
                'num_units_max' => $b['num_units'],
                'num_units_total' => $b['num_units'],
                'lastchange' => $b['lastchange']
              ];
            } else {
              $keyedReturn[$b['groupname']]['bookletsStarted'] += 1;
              $keyedReturn[$b['groupname']]['num_units_total'] += $b['num_units'];
              if ($b['num_units'] > $keyedReturn[$b['groupname']]['num_units_max']) {
                $keyedReturn[$b['groupname']]['num_units_max'] = $b['num_units'];
              }
              if ($b['num_units'] < $keyedReturn[$b['groupname']]['num_units_min']) {
                $keyedReturn[$b['groupname']]['num_units_min'] = $b['num_units'];
              }
              if ($b['lastchange'] > $keyedReturn[$b['groupname']]['lastchange']) {
                $keyedReturn[$b['groupname']]['lastchange'] = $b['lastchange'];
              }
            }
          }

          // get rid of the key and calculate mean
          foreach($keyedReturn as $group => $groupData) {
            $groupData['num_units_mean'] = $groupData['num_units_total'] / $groupData['bookletsStarted'];
            array_push($myreturn, $groupData);
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
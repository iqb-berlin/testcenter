<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

require_once('DBConnection.php');

class DBConnectionLogin extends DBConnection {

    // __________________________
    public function login($workspace, $name, $mode, $sessiondef) {
        $myreturn = '';
        if (($this->pdoDBhandle != false) and 
                isset($workspace) and isset($name) > 0) {

			$sql_select = $this->pdoDBhandle->prepare(
				'SELECT logins.id, logins.token FROM logins
					WHERE logins.name = :name AND logins.workspace_id = :ws');
				
			if ($sql_select->execute(array(
				':name' => $name, 
				':ws' => $workspace))) {

				$old_login = $sql_select->fetch(PDO::FETCH_ASSOC);
				if ($old_login === false) {
                    $mytoken = uniqid('a', true);
					$sql_insert = $this->pdoDBhandle->prepare(
						'INSERT INTO logins (token, session_def, valid_until, name, mode, workspace_id) 
							VALUES(:token, :sd, :valid_until, :name, :mode, :ws)');

					if ($sql_insert->execute(array(
						':token' => $mytoken,
						':sd' => $sessiondef,
                        ':valid_until' => date('Y-m-d G:i:s', time() + $this->idletime),
                        ':name' => $name,
                        ':mode' => $mode,
                        ':ws' => $workspace
                        ))) {
                            $myreturn = $mytoken;
                    }
                } else {
                    $sql_update = $this->pdoDBhandle->prepare(
                        'UPDATE logins
                            SET valid_until =:value, session_def =:sd
                            WHERE id =:loginid');
            
                    $sql_update->execute(array(
                        ':value' => date('Y/m/d h:i:s a', time() + $this->idletime),
                        ':sd'=> $sessiondef,
                        ':loginid'=>$old_login['id']
                    ));
                    $myreturn = $old_login['token'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getSessions($logintoken) {
		$myreturn = ['ws' => '', 'sessions' => [], 'mode' => ''];
        if (($this->pdoDBhandle != false) and (count($logintoken) > 0)) {
			$sql_select = $this->pdoDBhandle->prepare(
				'SELECT logins.session_def, logins.workspace_id, logins.mode, logins.id FROM logins
					WHERE logins.token = :token');
				
			if ($sql_select->execute(array(
				':token' => $logintoken))) {

				$logindata = $sql_select->fetch(PDO::FETCH_ASSOC);
				if ($logindata !== false) {
                    $myreturn['sessions'] = json_decode($logindata['session_def'], true);
                    $myreturn['ws'] = $logindata['workspace_id'];
                    $myreturn['mode'] = $logindata['mode'];
                    $myreturn['login_id'] = $logindata['id'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    // returns all possible booklets of a login for each possible code
    public function getBooklets($logintoken) {
        $myreturn = $this->getSessions($logintoken);
        $myreturn['booklets'] = [];

        if (count($myreturn['sessions']) > 0) {
            $bookletDef = $myreturn['sessions'];
            
            // collect all codes
            $allCodes = [];
            foreach($bookletDef as $b) {
                if (count($b['codes']) > 0) {
                    foreach($b['codes'] as $c) {
                        // ?? strtoupper
                        if (! in_array($c, $allCodes)) {
                            array_push($allCodes, $c);
                        }
                    }
                }
            }
            foreach($bookletDef as $b) {
                $myBookletObject = ['name' => strtoupper($b['name'])];

                if ((count($b['codes']) == 0) && (count($allCodes) > 0)) {
                    // add all possible codes
                    foreach($allCodes as $c) {
                        if (!isset($myreturn['booklets'][$c])) {
                            $myreturn['booklets'][$c] = [];
                        }
                        if (!in_array($c, $myreturn['booklets'][$c])) {
                            array_push($myreturn['booklets'][$c], $myBookletObject);
                        }
                    }
                } else {
                    if (count($b['codes']) > 0) {
                        foreach($b['codes'] as $c) {
                            if (!isset($myreturn['booklets'][$c])) {
                                $myreturn['booklets'][$c] = [];
                            }
                            if (!in_array($c, $myreturn['booklets'][$c])) {
                                array_push($myreturn['booklets'][$c], $myBookletObject);
                            }
                        }
                    } else {
                        if (!isset($myreturn['booklets'][''])) {
                            $myreturn['booklets'][''] = [];
                        }
                        if (!in_array($c, $myreturn['booklets'][''])) {
                            array_push($myreturn['booklets'][''], $myBookletObject);
                        }
                    }
                }
            }                
        }
        return $myreturn;
    }

    // __________________________
    public function getBookletStatus($logintoken, $code, $bookletname) {
        $myreturn = ['canStart' => false, 'statusLabel' => 'Zugriff verweigert', 'lastUnit' => 0];
        
        $mySessions = $this->getSessions($logintoken);
        if (count($mySessions['sessions']) > 0) {
            $bookletDef = $mySessions['sessions'];
            // check whether code and booklet are part of login
            $bookletFound = false;
            foreach($bookletDef as $b) {
                // todo: notbefore/notafter
                if (strtoupper($b['name']) == $bookletname) {
                    if (count($b['codes']) > 0) {
                        if (in_array($code, $b['codes'])) {
                            $bookletFound = true;
                        }
                    } else {
                        $bookletFound = true;
                    }
                }
                if ($bookletFound) {
                    break;
                }
            }

            if ($bookletFound) {
                $myreturn['canStart'] = true;
                $myreturn['statusLabel'] = 'Zum Starten hier klicken';
    
                $session_select = $this->pdoDBhandle->prepare(
                    'SELECT sessions.id FROM sessions
                        WHERE sessions.login_id = :loginid and sessions.code = :code');
                    
                if ($session_select->execute(array(
                    ':loginid' => $mySessions['login_id'],
                    ':code' => $code
                    ))) {
    
                    $sessiondata = $session_select->fetch(PDO::FETCH_ASSOC);
                    if ($sessiondata !== false) {
                        $booklet_select = $this->pdoDBhandle->prepare(
                            'SELECT booklets.laststate, booklets.locked FROM booklets
                                WHERE booklets.session_id = :sessionid and booklets.name = :bookletname');
                            
                        if ($booklet_select->execute(array(
                            ':sessionid' => $sessiondata['id'],
                            ':bookletname' => $$bookletname
                            ))) {
            
                            $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                            if ($bookletdata !== false) {
                                $laststate = json_decode($bookletdata['laststate'], true);
                                if (isset($laststate['u'])) {
                                    $myreturn['lastUnit'] = $laststate['u'];
                                }
                                if ($bookletdata['locked'] === 't') {
                                    $myreturn['canStart'] = false;
                                    $myreturn['statusLabel'] = 'Gesperrt';
                                    // later: differentiate between finished, cancelled etc.
                                } else {
                                    $myreturn['statusLabel'] = 'Zum Fortsetzen hier klicken';
                                }
                            }
                        }
                    }
                }
            }
        }
        return $myreturn;
    }
    
}

?>
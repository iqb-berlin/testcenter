<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

require_once('DBConnection.php');

class DBConnectionLogin extends DBConnection {

    // __________________________
    public function login($workspace, $groupname, $name, $mode, $sessiondef) {
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
						'INSERT INTO logins (token, session_def, valid_until, name, mode, workspace_id, groupname) 
							VALUES(:token, :sd, :valid_until, :name, :mode, :ws, :groupname)');

					if ($sql_insert->execute(array(
						':token' => $mytoken,
						':sd' => $sessiondef,
                        ':valid_until' => date('Y-m-d G:i:s', time() + $this->idletime),
                        ':name' => $name,
                        ':mode' => $mode,
                        ':ws' => $workspace,
                        ':groupname' => $groupname
                        ))) {
                            $myreturn = $mytoken;
                    }
                } else {
                    $sql_update = $this->pdoDBhandle->prepare(
                        'UPDATE logins
                            SET valid_until =:value, session_def =:sd, groupname =:groupname
                            WHERE id =:loginid');
            
                    $sql_update->execute(array(
                        ':value' => date('Y/m/d h:i:s a', time() + $this->idletime),
                        ':sd'=> $sessiondef,
                        ':loginid'=>$old_login['id'],
                        ':groupname'=>$groupname
                    ));
                    $myreturn = $old_login['token'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getAllBookletsByLoginToken($logintoken) {
        $myreturn = ['mode' => '', 'groupname' => '', 'loginname' => '', 'workspaceName' => '', 'booklets' => []];

		$myreturn = ['workspaceName' => '', 'booklets' => [], 'mode' => ''];
        if (($this->pdoDBhandle != false) and (count($logintoken) > 0)) {
			$sql_select = $this->pdoDBhandle->prepare(
				'SELECT logins.session_def, logins.workspace_id, logins.mode, logins.groupname,
                        logins.id, logins.name as lname, workspaces.name as wname FROM logins
                    INNER JOIN workspaces ON workspaces.id = logins.workspace_id
					WHERE logins.token = :token');
				
			if ($sql_select->execute(array(
				':token' => $logintoken))) {

				$logindata = $sql_select->fetch(PDO::FETCH_ASSOC);
				if ($logindata !== false) {
                    $myreturn['booklets'] = json_decode($logindata['session_def'], true);
                    $myreturn['workspaceName'] = $logindata['wname'];
                    $myreturn['loginname'] = $logindata['lname'];
                    $myreturn['groupname'] = $logindata['groupname'];
                    $myreturn['ws'] = $logindata['workspace_id'];
                    $myreturn['mode'] = $logindata['mode'];
                    $myreturn['login_id'] = $logindata['id'];
                    $myreturn['codeswithbooklets'] = $this->getCodesWithBooklets($myreturn['booklets']);
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    // returns all possible booklets of a login for each possible code
    private function getCodesWithBooklets($sessiondef) {
        $myreturn = [];

        if (count($sessiondef) > 0) {
            // collect all codes
            $allCodes = [];
            foreach($sessiondef as $b) {
                if (count($b['codes']) > 0) {
                    foreach($b['codes'] as $c) {
                        // ?? strtoupper
                        if (! in_array($c, $allCodes)) {
                            array_push($allCodes, $c);
                        }
                    }
                }
            }

            foreach($sessiondef as $b) {
                $myBookletName = $b['name'];

                if ((count($b['codes']) == 0) && (count($allCodes) > 0)) {
                    // add all possible codes
                    foreach($allCodes as $c) {
                        if (!isset($myreturn[$c])) {
                            $myreturn[$c] = [];
                        }
                        if (!in_array($c, $myreturn[$c])) {
                            array_push($myreturn[$c], $myBookletName);
                        }
                    }
                } else {
                    if (count($b['codes']) > 0) {
                        foreach($b['codes'] as $c) {
                            if (!isset($myreturn[$c])) {
                                $myreturn[$c] = [];
                            }
                            if (!in_array($c, $myreturn[$c])) {
                                array_push($myreturn[$c], $myBookletName);
                            }
                        }
                    } else {
                        if (!isset($myreturn[''])) {
                            $myreturn[''] = [];
                        }
                        if (!in_array($c, $myreturn[''])) {
                            array_push($myreturn[''], $myBookletName);
                        }
                    }
                }
            }                
        }
        return $myreturn;
    }

    // __________________________
    public function getBookletStatusNL($logintoken, $code, $bookletname) {
        $myreturn = ['canStart' => false, 'statusLabel' => 'Zugriff verweigert', 'lastUnit' => 0];

        if (($this->pdoDBhandle != false) and (count($logintoken) > 0)) {
			$sql_select = $this->pdoDBhandle->prepare(
				'SELECT logins.session_def, logins.id FROM logins
					WHERE logins.token = :token');
				
			if ($sql_select->execute(array(
				':token' => $logintoken))) {

				$logindata = $sql_select->fetch(PDO::FETCH_ASSOC);
				if ($logindata !== false) {
                    $myBooklets = json_decode($logindata['session_def'], true);

                    if (count($myBooklets) > 0) {
                        // check whether code and booklet are part of login
                        $bookletFound = false;
                        foreach($myBooklets as $b) {
                            // todo: notbefore/notafter
                            if (strtoupper($b['name']) == strtoupper($bookletname)) {
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
                
                            $people_select = $this->pdoDBhandle->prepare(
                                'SELECT people.id FROM people
                                    WHERE people.login_id = :loginid and people.code = :code');
                                
                            if ($people_select->execute(array(
                                ':loginid' => $logindata['id'],
                                ':code' => $code
                                ))) {
                
                                $persondata = $people_select->fetch(PDO::FETCH_ASSOC);
                                if ($persondata !== false) {
                                    $booklet_select = $this->pdoDBhandle->prepare(
                                        'SELECT booklets.laststate, booklets.locked FROM booklets
                                            WHERE booklets.person_id = :personid and booklets.name = :bookletname');
                                        
                                    if ($booklet_select->execute(array(
                                        ':personid' => $persondata['id'],
                                        ':bookletname' => $bookletname
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
                }
            }
        }
        return $myreturn;
    }
    
}

?>
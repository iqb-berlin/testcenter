<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

require_once('DBConnection.php');

class DBConnectionStart extends DBConnection {

    // __________________________
    public function login($workspace, $groupname, $name, $mode, $bookletdef) {
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
						'INSERT INTO logins (token, booklet_def, valid_until, name, mode, workspace_id, groupname) 
							VALUES(:token, :sd, :valid_until, :name, :mode, :ws, :groupname)');

					if ($sql_insert->execute(array(
						':token' => $mytoken,
						':sd' => json_encode($bookletdef),
                        ':valid_until' => date('Y-m-d H:i:s', time() + $this->idletime),
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
                            SET valid_until =:value, booklet_def =:sd, groupname =:groupname
                            WHERE id =:loginid');
            
                    $sql_update->execute(array(
                        ':value' => date('Y-m-d H:i:s', time() + $this->idletime),
                        ':sd'=> json_encode($bookletdef),
                        ':loginid'=>$old_login['id'],
                        ':groupname'=>$groupname
                    ));
                    $myreturn = $old_login['token'];
                }
            }
        }
        return $myreturn;
    }

    public function authOk($persontoken, $bookletDbId, $RW = false) {
        $myreturn = false;

        if (isset($bookletDbId) && isset($persontoken)) {
            if ((strlen($persontoken) > 0) and (strlen($bookletDbId) > 0) and is_numeric($bookletDbId)) {

                // 6666666666666666666666
                $booklet_select = $this->pdoDBhandle->prepare(
                    'SELECT booklets.locked FROM booklets
                        INNER JOIN persons ON persons.id = booklets.person_id
                        WHERE persons.token=:token and booklets.id=:bookletId');
                    
                if ($booklet_select->execute(array(
                    ':token' => $persontoken,
                    ':bookletId' => $bookletDbId
                    ))) {
    
                    $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                    if ($bookletdata !== false) {
                        $myreturn = ($RW === false) || ($bookletdata['locked'] !== 't');
                    }
                }
    
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getAllBookletsByLoginToken($logintoken) {
        $myreturn = ['mode' => '', 'groupname' => '', 'loginname' => '', 'workspaceName' => '', 'booklets' => []];

        if (($this->pdoDBhandle != false) and (strlen($logintoken) > 0)) {
			$sql_select = $this->pdoDBhandle->prepare(
				'SELECT logins.booklet_def, logins.workspace_id, logins.mode, logins.groupname,
                        logins.id, logins.name as lname, workspaces.name as wname FROM logins
                    INNER JOIN workspaces ON workspaces.id = logins.workspace_id
					WHERE logins.token = :token');
				
			if ($sql_select->execute(array(
				':token' => $logintoken))) {

				$logindata = $sql_select->fetch(PDO::FETCH_ASSOC);
				if ($logindata !== false) {
                    $myreturn['booklets'] = json_decode($logindata['booklet_def'], true);
                    $myreturn['workspaceName'] = $logindata['wname'];
                    $myreturn['loginname'] = $logindata['lname'];
                    $myreturn['groupname'] = $logindata['groupname'];
                    $myreturn['ws'] = $logindata['workspace_id'];
                    $myreturn['mode'] = $logindata['mode'];
                    $myreturn['login_id'] = $logindata['id'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function getAllBookletsByPersonToken($persontoken) {
        $myreturn = ['mode' => '', 'groupname' => '', 'loginname' => '', 'workspaceName' => '', 'booklets' => [], 'code' => ''];

        if (($this->pdoDBhandle != false) and (strlen($persontoken) > 0)) {
			$sql_select = $this->pdoDBhandle->prepare(
				'SELECT logins.booklet_def, logins.workspace_id, logins.mode, logins.groupname, logins.token as logintoken,
                        logins.id, logins.name as lname, workspaces.name as wname, persons.code FROM persons
                    INNER JOIN logins ON logins.id = persons.login_id
                    INNER JOIN workspaces ON workspaces.id = logins.workspace_id
					WHERE persons.token = :token');
				
			if ($sql_select->execute(array(
				':token' => $persontoken))) {

				$logindata = $sql_select->fetch(PDO::FETCH_ASSOC);
				if ($logindata !== false) {
                    $myreturn['booklets'] = json_decode($logindata['booklet_def'], true);
                    $myreturn['workspaceName'] = $logindata['wname'];
                    $myreturn['loginname'] = $logindata['lname'];
                    $myreturn['logintoken'] = $logindata['logintoken'];
                    $myreturn['groupname'] = $logindata['groupname'];
                    $myreturn['ws'] = $logindata['workspace_id'];
                    $myreturn['mode'] = $logindata['mode'];
                    $myreturn['login_id'] = $logindata['id'];
                    $myreturn['code'] = $logindata['code'];
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    // having just the login, entry in the booklet table could be missing; so we have to go
    // through the booklet_def
    public function getBookletStatusNL($logintoken, $code, $bookletid, $bookletlabel) {
        // 'canStart' => false, 'statusLabel' => 'Zugriff verweigert', 'lastUnit' => 0, 'label' => ''
        $myreturn = [];

        if (($this->pdoDBhandle != false) and (strlen($logintoken) > 0)) {
			$sql_select = $this->pdoDBhandle->prepare(
				'SELECT logins.booklet_def, logins.id FROM logins
					WHERE logins.token = :token');
				
			if ($sql_select->execute(array(
				':token' => $logintoken))) {

				$logindata = $sql_select->fetch(PDO::FETCH_ASSOC);
				if ($logindata !== false) {
                    $myBookletData = json_decode($logindata['booklet_def'], true);
                    if (isset($myBookletData[$code])) {
                        if (in_array($bookletid, $myBookletData[$code])) {
                            $myreturn['canStart'] = true;
                            $myreturn['statusLabel'] = 'Zum Starten hier klicken';
                            $myreturn['label'] = $bookletlabel;
                
                            $persons_select = $this->pdoDBhandle->prepare(
                                'SELECT persons.id FROM persons
                                    WHERE persons.login_id = :loginid and persons.code = :code');
                                
                            if ($persons_select->execute(array(
                                ':loginid' => $logindata['id'],
                                ':code' => $code
                                ))) {
                
                                $persondata = $persons_select->fetch(PDO::FETCH_ASSOC);
                                if ($persondata !== false) {
                                    $booklet_select = $this->pdoDBhandle->prepare(
                                        'SELECT booklets.laststate, booklets.locked, booklets.label, booklets.id FROM booklets
                                            WHERE booklets.person_id = :personid and booklets.name = :bookletname');
                                        
                                    if ($booklet_select->execute(array(
                                        ':personid' => $persondata['id'],
                                        ':bookletname' => $bookletid
                                        ))) {
                        
                                        $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                                        if ($bookletdata !== false) {
                                            $myreturn['label'] = $bookletdata['label'];
                                            $myreturn['id'] = $bookletdata['id'];
                                            $laststate = json_decode($bookletdata['laststate'], true);
                                            if (isset($laststate['u'])) {
                                                $myreturn['lastUnit'] = $laststate['u'];
                                            }

                                            if ($bookletdata['locked'] === "1") {
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

    public function getWorkspaceIdByPersonToken($persontoken) {
        $myreturn = '';

        if (($this->pdoDBhandle != false) and (strlen($persontoken) > 0)) {
			$sql_select = $this->pdoDBhandle->prepare(
				'SELECT logins.workspace_id FROM persons
                    INNER JOIN logins ON logins.id = persons.login_id
					WHERE persons.token = :token');
				
			if ($sql_select->execute(array(
				':token' => $persontoken))) {

				$logindata = $sql_select->fetch(PDO::FETCH_ASSOC);
				if ($logindata !== false) {
                    $myreturn = $logindata['workspace_id'];
                }
            }
        }
        return $myreturn;
    }

    public function getBookletStatusNP($persontoken, $bookletname) {
        // 'canStart' => false, 'statusLabel' => 'Zugriff verweigert', 'lastUnit' => 0, 'label' => ''
        $myreturn = [];

        if (($this->pdoDBhandle != false) and (strlen($persontoken) > 0)) {
			$sql_select = $this->pdoDBhandle->prepare(
				'SELECT logins.booklet_def, persons.id, persons.code FROM persons
                    INNER JOIN logins ON logins.id = persons.login_id
					WHERE persons.token = :token');
				
			if ($sql_select->execute(array(
				':token' => $persontoken))) {

				$logindata = $sql_select->fetch(PDO::FETCH_ASSOC);
				if ($logindata !== false) {
                    $myBooklets = json_decode($logindata['booklet_def'], true);
                    $code = $logindata['code'];
                    $personId = $logindata['id'];

                    if (count($myBooklets) > 0) {
                        // check whether code and booklet are part of login
                        $bookletFound = false;
                        if (isset($myBooklets[$code])) {
                            $bookletFound = in_array($bookletname, $myBooklets[$code]);
                        }

                        if ($bookletFound) {
                            $myreturn['canStart'] = true;
                            $myreturn['statusLabel'] = 'Zum Starten hier klicken';
                
                            $booklet_select = $this->pdoDBhandle->prepare(
                                'SELECT booklets.laststate, booklets.locked, booklets.label, booklets.id FROM booklets
                                    WHERE booklets.person_id = :personid and booklets.name = :bookletname');
                                
                            if ($booklet_select->execute(array(
                                ':personid' => $personId,
                                ':bookletname' => $bookletname
                                ))) {
                
                                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                                if ($bookletdata !== false) {
                                    $myreturn['label'] = $bookletdata['label'];
                                    $myreturn['id'] = $bookletdata['id'];
                                    $laststate = json_decode($bookletdata['laststate'], true);
                                    if (isset($laststate['u'])) {
                                        $myreturn['lastUnit'] = $laststate['u'];
                                    }
                                    if ($bookletdata['locked'] === '1') {
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
        return $myreturn;
    }
    
    // __________________________
    public function getBookletStatusPI($persontoken, $bookletId) {
        // 'canStart' => false, 'statusLabel' => 'Zugriff verweigert', 'lastUnit' => 0, 'label' => ''
        $myreturn = [];

        if (($this->pdoDBhandle != false) and (strlen($persontoken) > 0)) {
            $myreturn['canStart'] = true;
            $myreturn['statusLabel'] = 'Zum Starten hier klicken';

            $booklet_select = $this->pdoDBhandle->prepare(
                'SELECT booklets.laststate, booklets.locked, booklets.label FROM booklets
                    INNER JOIN persons on persons.id = booklets.person_id
                    WHERE persons.token = :token 
                        and booklets.id = :bookletId');
                
            if ($booklet_select->execute(array(
                ':token' => $persontoken,
                ':bookletId' => $bookletId
                ))) {

                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                if ($bookletdata !== false) {
                    $myreturn['label'] = $bookletdata['label'];
                    $myreturn['id'] = $bookletId;
                    $laststate = json_decode($bookletdata['laststate'], true);
                    if (isset($laststate['u'])) {
                        $myreturn['lastUnit'] = $laststate['u'];
                    }
                    if ($bookletdata['locked'] === '1') {
                        $myreturn['canStart'] = false;
                        $myreturn['statusLabel'] = 'Gesperrt';
                        // later: differentiate between finished, cancelled etc.
                    } else {
                        $myreturn['statusLabel'] = 'Zum Fortsetzen hier klicken';
                    }
                }
            }
        }
        return $myreturn;
    }

    // __________________________
    public function lockBooklet($bookletDBId) {
        $myreturn = false;
        if ($this->pdoDBhandle != false) {
            $booklet_update = $this->pdoDBhandle->prepare(
                'UPDATE booklets SET locked = "t" WHERE id = :id');
            if ($booklet_update -> execute(array(
                ':id' => $bookletDBId))) {
                $myreturn = true;
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// returns the name of the workspace given by id
	// returns '' if not found
	// token is not refreshed
	public function getWorkspaceName($workspace_id) {
		$myreturn = '';
		if ($this->pdoDBhandle != false) {

			$sql = $this->pdoDBhandle->prepare(
				'SELECT workspaces.name FROM workspaces
					WHERE workspaces.id=:workspace_id');
				
			if ($sql -> execute(array(
				':workspace_id' => $workspace_id))) {
					
				$data = $sql -> fetch(PDO::FETCH_ASSOC);
				if ($data != false) {
					$myreturn = $data['name'];
				}
			}
		}
			
		return $myreturn;
	}
}

?>
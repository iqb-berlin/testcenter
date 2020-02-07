<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Mechtel
// 2018, 2019
// license: MIT



class DBConnectionStart extends DBConnection {
    private $idletimeSession = 60 * 30;

    // #######################################################################################
    // #######################################################################################
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
                        ':valid_until' => date('Y-m-d H:i:s', time() + $this->idleTime),
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
                        ':value' => date('Y-m-d H:i:s', time() + $this->idleTime),
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

    // #######################################################################################
    // #######################################################################################
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

    // #######################################################################################
    // #######################################################################################
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

    // #######################################################################################
    // #######################################################################################
    // if the booklet is not found in the database, the booklet label will be empty and
    // the bookletid will be 0
    public function getBookletStatus($logintoken, $code, $persontoken, $bookletid, $bookletDbId) {
        $myreturn = []; // if not valid query then this will be the return

        if ($this->pdoDBhandle != false) {
            $logintoken = isset($logintoken) ? $logintoken : '';
            $code = isset($code) ? $code : '';
            $persontoken = isset($persontoken) ? $persontoken : '';
            $bookletid = isset($bookletid) ? $bookletid : '';
            $bookletDbId = isset($bookletDbId) ? $bookletDbId : 0;

            // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            // persontoken and bookletDbId (after start)
            if ((strlen($persontoken) > 0) && ($bookletDbId > 0)) {
                $booklet_select = $this->pdoDBhandle->prepare(
                    'SELECT booklets.laststate, booklets.locked, booklets.label FROM booklets
                        INNER JOIN persons on persons.id = booklets.person_id
                        WHERE persons.token = :token 
                            and booklets.id = :bookletId');
                    
                if ($booklet_select->execute(array(
                    ':token' => $persontoken,
                    ':bookletId' => $bookletDbId
                    ))) {
    
                    $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                    if ($bookletdata !== false) {
                        $myreturn['canStart'] = true;
                        $myreturn['statusLabel'] = 'Zum Starten hier klicken';
                        $myreturn['label'] = $bookletdata['label'];
                        $myreturn['id'] = $bookletDbId;
                        $myreturn['laststate'] = json_decode($bookletdata['laststate'], true);

                        if ($bookletdata['locked'] == '1') {
                            $myreturn['canStart'] = false;
                            $myreturn['statusLabel'] = 'Beendet';
                        } else {
                            $myreturn['statusLabel'] = 'Zum Fortsetzen hier klicken';
                        }
                    }
                }

            // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            // persontoken and bookletid (before start, after having started another booklet)
            } elseif ((strlen($persontoken) > 0) && (strlen($bookletid) > 0)) {
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
                            $bookletValid = false;
                            if (isset($myBooklets[$code])) {
                                $bookletValid = in_array($bookletid, $myBooklets[$code]);
                            }
    
                            if ($bookletValid) {
                                $myreturn = [
                                    'canStart' => true,
                                    'statusLabel' => 'Zum Starten hier klicken',
                                    'label' => '',
                                    'id' => 0,
                                    'lastUnit' => 0
                                ];

                                $booklet_select = $this->pdoDBhandle->prepare(
                                    'SELECT booklets.laststate, booklets.locked, booklets.label, booklets.id FROM booklets
                                        WHERE booklets.person_id = :personid and booklets.name = :bookletname');
                                    
                                if ($booklet_select->execute(array(
                                    ':personid' => $personId,
                                    ':bookletname' => $bookletid
                                    ))) {
                    
                                    $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                                    if ($bookletdata !== false) {
                                        $myreturn['label'] = $bookletdata['label'];
                                        $myreturn['id'] = $bookletdata['id'];
                                        $myreturn['laststate'] = json_decode($bookletdata['laststate'], true);

                                        if ($bookletdata['locked'] == '1') {
                                            $myreturn['canStart'] = false;
                                            $myreturn['statusLabel'] = 'Beendet';
                                        } else {
                                            $myreturn['statusLabel'] = 'Zum Fortsetzen hier klicken';
                                        }
                                    }
                                }
                            }
                        }
                    }
                }    
            // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            // logintoken, code and bookletid (before start)
            } elseif ((strlen($logintoken) > 0) && (strlen($bookletid) > 0)) {
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
                                $myreturn = [
                                    'canStart' => true,
                                    'statusLabel' => 'Zum Starten hier klicken',
                                    'label' => '',
                                    'id' => 0,
                                    'lastUnit' => 0
                                ];
                    
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
                                                $myreturn['laststate'] = json_decode($bookletdata['laststate'], true);

                                                if ($bookletdata['locked'] == '1') {
                                                    $myreturn['canStart'] = false;
                                                    $myreturn['statusLabel'] = 'Beendet';
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
        }
        return $myreturn;
    }


    // #######################################################################################
    // #######################################################################################
    public function startBookletByLoginToken($logintoken, $code, $booklet, $bookletLabel) {
        $myreturn = [];
        if ($this->pdoDBhandle != false) {
            $login_select = $this->pdoDBhandle->prepare(
                'SELECT logins.id FROM logins
                    WHERE logins.token=:token');
                
            if ($login_select->execute(array(
                ':token' => $logintoken
                ))) {

                $logindata = $login_select->fetch(PDO::FETCH_ASSOC);
                if ($logindata !== false) {
                    // ++++++++++++++++++++++++++++++++++++++++++++++
                    // logintoken ok
                    // delete old persontoken and get new one

                    $personToken = '';
                    $tempToken = uniqid('a', true);

                    $persons_select = $this->pdoDBhandle->prepare(
                        'SELECT persons.id FROM persons
                            WHERE persons.login_id=:id and persons.code=:code');
                    if ($persons_select->execute(array(
                        ':id' => $logindata['id'],
                        ':code' => $code
                        ))) {
        
                        $persondata = $persons_select->fetch(PDO::FETCH_ASSOC);
                        if ($persondata !== false) {
                            // overwrite token
                            $booklet_update = $this->pdoDBhandle->prepare(
                                'UPDATE persons SET valid_until =:valid_until, token=:token WHERE id = :id');
                            if ($booklet_update -> execute(array(
                                ':valid_until' => date('Y-m-d H:i:s', time() + $this->idletimeSession),
                                ':token' => $tempToken,
                                ':id' => $persondata['id']))) {
                                $personToken = $tempToken;
                            }
                        }
                    }

                    if (strlen($personToken) === 0) {
                        $booklet_insert = $this->pdoDBhandle->prepare(
                            'INSERT INTO persons (token, code, login_id, valid_until) 
                                VALUES(:token, :code, :login_id, :valid_until)');
    
                        if ($booklet_insert->execute(array(
                            ':token' => $tempToken,
                            ':code' => $code,
                            ':login_id' => $logindata['id'],
                            ':valid_until' => date('Y-m-d H:i:s', time() + $this->idletimeSession)
                            ))) {
                                $personToken = $tempToken;
                        }
                    }

                    // ++++++++++++++++++++++++++++++++++++++++++++++
                    // start booklet
                    if (strlen($personToken) > 0) {
                        $myreturn = $this->startBookletByPersonToken($personToken, $booklet, $bookletLabel);
                    }
                }
            }
        }
        return $myreturn;
    }

    // #######################################################################################
    // #######################################################################################
    public function startBookletByPersonToken($persontoken, $booklet, $bookletLabel) {
        $myreturn = [];
        if ($this->pdoDBhandle != false) {
            $persons_select = $this->pdoDBhandle->prepare(
                'SELECT persons.id FROM persons
                    WHERE persons.token=:token');
                
            if ($persons_select->execute(array(
                ':token' => $persontoken
                ))) {

                $persondata = $persons_select->fetch(PDO::FETCH_ASSOC);
                if ($persondata !== false) {
                    // ++++++++++++++++++++++++++++++++++++++++++++++
                    // persontoken ok

                    $bookletDbId = 0;
                    $isLocked = false;

                    $booklet_select = $this->pdoDBhandle->prepare(
                        'SELECT booklets.locked, booklets.id, booklets.laststate FROM booklets
                            WHERE booklets.person_id=:personId and booklets.name=:bookletname');
                        
                    if ($booklet_select->execute(array(
                        ':personId' => $persondata['id'],
                        ':bookletname' => $booklet
                        ))) {
        
                        $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                        if ($bookletdata !== false) {
                            if ($bookletdata['locked'] == '1') {
                                $isLocked = true;
                            } else {
                                $booklet_update = $this->pdoDBhandle->prepare(
                                    'UPDATE booklets SET label = :label WHERE id = :id');
                                if ($booklet_update -> execute(array(
                                    ':label' => $bookletLabel,
                                    ':id' => $bookletdata['id']))) {
                                    $bookletDbId = $bookletdata['id'];
                                }
                            }
                        }
                    }

                    if (($bookletDbId === 0) && !$isLocked) {
                        // create new booklet record
                        try{
                            $this->pdoDBhandle->beginTransaction();
                            $booklet_insert = $this->pdoDBhandle->prepare(
                                'INSERT INTO booklets (person_id, name, label) 
                                    VALUES(:person_id, :name, :label)');
        
                            if ($booklet_insert->execute(array(
                                ':person_id' => $persondata['id'],
                                ':name' => $booklet,
                                ':label' => $bookletLabel
                                ))) {
    
                                $bookletDbId = $this->pdoDBhandle->lastInsertId();
                            }
    
                            $this->pdoDBhandle->commit();
                        } 

                        catch(Exception $e){
                            $this->pdoDBhandle->rollBack();
                            $bookletDbId = 0;
                        }
                    }
                }
            }
        }
        if ($bookletDbId > 0) {
            $myreturn = [
                'bookletDbId' => $bookletDbId,
                'persontoken' => $persontoken
            ];
        }

        return $myreturn;
    }
} 
?>

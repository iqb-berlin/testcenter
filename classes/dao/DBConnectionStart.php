<?php

/** @noinspection PhpUnhandledExceptionInspection */


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
                    $myreturn['booklets'] = JSON::decode($logindata['booklet_def'], true);
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
                    $myreturn['booklets'] = JSON::decode($logindata['booklet_def'], true);
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
                        $myreturn['laststate'] = JSON::decode($bookletdata['laststate'], true);

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
                        $myBooklets = JSON::decode($logindata['booklet_def'], true);
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
                                        $myreturn['laststate'] = JSON::decode($bookletdata['laststate'], true);

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
                        $myBookletData = JSON::decode($logindata['booklet_def'], true);
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
                                                $myreturn['laststate'] = JSON::decode($bookletdata['laststate'], true);

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


    public function getLoginId(string $loginToken): int {

        return $this->_('SELECT logins.id FROM logins WHERE logins.token=:token', [':token' => $loginToken])['id'];
    }


    public function registerPerson(int $loginId, string $code): array {

        $newPersonToken = uniqid('a', true);

        $person = $this->_(
            'SELECT persons.id FROM persons WHERE persons.login_id=:id and persons.code=:code',
            [
                ':id' => $loginId,
                ':code' => $code
            ]
        );

        if ($person !== null) {

            $this->_(
                'UPDATE persons SET valid_until =:valid_until, token=:token WHERE id = :id',
                [
                    ':valid_until' => date('Y-m-d H:i:s', time() + $this->idletimeSession),
                    ':token' => $newPersonToken,
                    ':id' => $person['id']
                ]
            );
            $newPersonId = $person['id'];

        } else {

            $this->_(
                'INSERT INTO persons (token, code, login_id, valid_until) 
                VALUES(:token, :code, :login_id, :valid_until)',
                [
                    ':token' => $newPersonToken,
                    ':code' => $code,
                    ':login_id' => $loginId,
                    ':valid_until' => date('Y-m-d H:i:s', time() + $this->idletimeSession)
                ]
            );
            $newPersonId = $this->pdoDBhandle->lastInsertId();

        }

        return [
            'token' => $newPersonToken,
            'id' => $newPersonId
        ];
    }


    public function getPerson(string $personToken): array {

        return $this->_('SELECT * FROM persons WHERE persons.token=:token', [':token' => $personToken]);
        // TODO check valid_until
    }


    public function getOrCreateTest(string $personId, string $bookletName, string $bookletLabel) {

        $test = $this->_(
            'SELECT booklets.locked, booklets.id, booklets.laststate, booklets.label FROM booklets
            WHERE booklets.person_id=:personId and booklets.name=:bookletname',
            [
                ':personId' => $personId,
                ':bookletname' => $bookletName
            ]
        );

        if ($test !== null) {

            if ($test['locked'] != '1') {

                $this->_( // TODO is this necessary?
                    'UPDATE booklets SET label = :label WHERE id = :id',
                    [
                        ':label' => $bookletLabel,
                        ':id' => $test['id']
                    ]
                );

            }

            return $test;

        }

        $this->_(
            'INSERT INTO booklets (person_id, name, label) VALUES(:person_id, :name, :label)',
                [
                    ':person_id' => $personId,
                    ':name' => $bookletName,
                    ':label' => $bookletLabel
                ]
        );

        return [
            'id' => $this->pdoDBhandle->lastInsertId(),
            'label' => $bookletLabel,
            'name' => $bookletName,
            'person_id' => $personId,
            'locked' => '0',
            'lastState' => ''
        ];
    }
} 
?>

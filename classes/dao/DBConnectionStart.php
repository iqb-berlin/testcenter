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


    public function loginHasBooklet(string $loginToken, string $bookletName, string $code = '') {

        $bookletDef = $this->_('SELECT logins.booklet_def, logins.id FROM logins WHERE logins.token = :token', [':token' => $loginToken]);

        $booklet = JSON::decode($bookletDef['booklet_def'], true);

        return $booklet and isset($booklet[$code]) and in_array($bookletName, $booklet[$code]);
    }


    public function getBookletStatus(string $loginToken, string $bookletName, string $code = '') {

        $person = $this->getOrCreatePerson($this->getLoginId($loginToken), $code); // TODO work with personToken instead

        $test = $this->_(
            'SELECT booklets.laststate, booklets.locked, booklets.label, booklets.id FROM booklets
            WHERE booklets.person_id = :personid and booklets.name = :bookletname',
            [
                ':personid' => $person['id'],
                ':bookletname' => $bookletName
            ]
        );

        if ($test !== null) {

            $bookletStatus = [
                'running' => true,
                'canStart' => true,
                'statusLabel' => 'Zum Fortsetzen hier klicken',
                'label' => $test['label'],
                'id' => $test['id'],
                'locked' => $test['locked'],
                'lastState' => JSON::decode($test['laststate'], true)
            ];

            if ($test['locked'] == '1') {
                $bookletStatus['canStart'] = false;
                $bookletStatus['statusLabel'] = 'Beendet';
            }

            return $bookletStatus;

        } else {

            return [
                'running' => false,
                'canStart' => true,
                'statusLabel' => 'Zum Starten hier klicken'
            ];
        }
    }


    public function getLoginId(string $loginToken): int {

        $login = $this->_('SELECT logins.id FROM logins WHERE logins.token=:token', [':token' => $loginToken]);
        if ($login == null ){
            throw new HttpError("LoginToken invalid: `$loginToken`", 401);
        }
        return $login['id'];
    }


    public function getPersonId(string $personToken, string $code = ''): int {

        $person = $this->_('SELECT person.id FROM persons WHERE persons.token=:token and persons.code=:code',
            [
                ':token' => $personToken,
                ':code' => $code
            ]
        );
        if ($person == null ){
            throw new HttpError("PersonToken invalid: `$personToken`", 401);
        }
        return $person['id'];
    }


    public function getOrCreatePerson(int $loginId, string $code): array {

        $person = $this->_(
            'SELECT * FROM persons WHERE persons.login_id=:id and persons.code=:code',
            [
                ':id' => $loginId,
                ':code' => $code
            ]
        );

        if ($person !== null) {

            return $person;

        }

        $newPersonToken = uniqid('a', true);
        $validUntil = date('Y-m-d H:i:s', time() + $this->idletimeSession);

        $this->_(
            'INSERT INTO persons (token, code, login_id, valid_until) 
            VALUES(:token, :code, :login_id, :valid_until)',
            [
                ':token' => $newPersonToken,
                ':code' => $code,
                ':login_id' => $loginId,
                ':valid_until' => $validUntil
            ]
        );

        return [
            'id' => $this->pdoDBhandle->lastInsertId(),
            'token' => $newPersonToken,
            'login_id' => $loginId,
            'code' => $code,
            'valid_until' => $validUntil,
            'laststate' => null
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

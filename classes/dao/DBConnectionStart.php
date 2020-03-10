<?php

/** @noinspection PhpUnhandledExceptionInspection */


class DBConnectionStart extends DBConnection {

    private $idleTimeSession = 60 * 30;

    public function getOrCreateLoginToken(TestSession $session, bool $forceCreate = false): string {

        $oldLogin = $this->_(
            'SELECT logins.id, logins.token FROM logins
			WHERE logins.name = :name AND logins.workspace_id = :ws', [
                ':name' => $session->loginName,
                ':ws' => $session->workspaceId
            ]
        );

        if ($forceCreate or ($oldLogin === null)) {

            $loginToken = uniqid('a', true);
            $this->_(
                'INSERT INTO logins (token, booklet_def, valid_until, name, mode, workspace_id, groupname) 
                VALUES(:token, :sd, :valid_until, :name, :mode, :ws, :groupname)',
                [
                    ':token' => $loginToken,
                    ':sd' => json_encode($session->booklets),
                    ':valid_until' => date('Y-m-d H:i:s', time() + $this->idleTimeSession),
                    ':name' => $session->loginName,
                    ':mode' => $session->mode,
                    ':ws' => $session->workspaceId,
                    ':groupname' => $session->groupName
                ]
            );
            return $loginToken;
        }

        $this->_(
            'UPDATE logins
            SET valid_until =:value, booklet_def =:sd, groupname =:groupname
            WHERE id =:loginid',
            [
                ':value' => date('Y-m-d H:i:s', time() + $this->idleTimeSession),
                ':sd' => json_encode($session->booklets),
                ':loginid' => $oldLogin['id'],
                ':groupname' => $session->groupName
            ]
        );

        // TODO https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 store customTexts as well

        return $oldLogin['token'];
    }


    // TODO unit-test
    // TODO https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 get customTexts
    public function getSessionByLoginToken($loginToken): TestSession {

        $logindata = $this->_(
            'SELECT 
                logins.booklet_def, #
                logins.workspace_id as workspaceId, #
                logins.mode, #
                logins.groupname as groupName, #
                logins.id as loginId, 
                logins.name as loginName, #
                workspaces.name as workspaceName 
            FROM logins
                INNER JOIN workspaces ON workspaces.id = logins.workspace_id
			WHERE logins.token = :token',
            [':token' => $loginToken]
        );
				

        if ($logindata !== null) {
            $logindata['booklets'] = JSON::decode($logindata['booklet_def'], true);
            unset($logindata['booklet_def']);
        }

        return new TestSession($logindata);
    }


    // TODO unit-test
    // TODO https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 get customTexts
    public function getSessionByPersonToken($personToken): TestSession {

        $logindata = $this->_(
            'SELECT 
               logins.booklet_def,
               logins.workspace_id as workspaceId,
               logins.mode,
               logins.groupname as groupName,
               logins.token    as loginToken,
               logins.name     as loginName,
               workspaces.name as workspaceName,
               booklets.id     as testId,
               booklets.label  as bookletLabel
            FROM persons
                 INNER JOIN logins ON logins.id = persons.login_id
                 INNER JOIN workspaces ON workspaces.id = logins.workspace_id
                 INNER JOIN booklets ON booklets.person_id = persons.id
            WHERE persons.token =  :token',
            [':token' => $personToken]
        );


        if ($logindata !== null) {
            $logindata['booklets'] = JSON::decode($logindata['booklet_def'], true);
            unset($logindata['booklet_def']);
        }

        return new TestSession($logindata);
    }


    public function personHasBooklet(string $personToken, string $bookletName): bool {

        $bookletDef = $this->_('
            SELECT logins.booklet_def, logins.id, persons.code
            FROM logins
                     left join persons on (logins.id = persons.login_id)
            WHERE persons.token = :token',
            [
                ':token' => $personToken
            ]
        );

        $code = $bookletDef['code'];
        $codes2booklets = JSON::decode($bookletDef['booklet_def'], true);

        return $codes2booklets and isset($codes2booklets[$code]) and in_array($bookletName, $codes2booklets[$code]);
    }


    public function getBookletStatus(string $personToken, string $bookletName): array {

        $personId = $this->getPersonId($personToken);

        $test = $this->_(
            'SELECT booklets.laststate, booklets.locked, booklets.label, booklets.id FROM booklets
            WHERE booklets.person_id = :personid and booklets.name = :bookletname',
            [
                ':personid' => $personId,
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


    public function getPersonId(string $personToken): int {

        $person = $this->_('SELECT persons.id FROM persons WHERE persons.token=:token',
            [
                ':token' => $personToken
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
        $validUntil = date('Y-m-d H:i:s', time() + $this->idleTimeSession);

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

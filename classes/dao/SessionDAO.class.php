<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class SessionDAO extends DAO {

    // TODO add unit-test
    public function getOrCreateLoginToken(TestSession $session, bool $forceCreate = false): string {

        $oldLogin = $this->_(
            'SELECT logins.id, logins.token, logins.valid_until as "_validTo" FROM logins
			WHERE logins.name = :name AND logins.workspace_id = :ws', [
                ':name' => $session->name,
                ':ws' => $session->workspaceId
            ]
        );

        if ($forceCreate or ($oldLogin == null)) {

            $newLogin = $this->createLogin($session);
            return $newLogin->token;
        }

        TimeStamp::checkExpiration(0, (int) TimeStamp::fromSQLFormat($oldLogin['_validTo']));

        // TODO https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 store customTexts as well

        return $oldLogin['token'];
    }


    public function createLogin(TestSession $session, bool $allowExpired = false): LoginSession {

        if (!$allowExpired) {
            TimeStamp::checkExpiration($session->_validFrom, $session->_validTo);
        }

        $validUntil = TimeStamp::expirationFromNow($session->_validTo, $session->_validForMinutes);

        $loginToken = $this->_randomToken('login', (string) $session->name);

        $this->_(
            'INSERT INTO logins (token, booklet_def, valid_until, name, mode, workspace_id, groupname) 
                VALUES(:token, :sd, :valid_until, :name, :mode, :ws, :groupname)',
            [
                ':token' => $loginToken,
                ':sd' => json_encode($session->booklets),
                ':valid_until' => TimeStamp::toSQLFormat($validUntil),
                ':name' => $session->name,
                ':mode' => $session->mode,
                ':ws' => $session->workspaceId,
                ':groupname' => $session->groupName
            ]
        );

        return new LoginSession([
            'id' => (int) $this->pdoDBhandle->lastInsertId(),
            'token' => $loginToken,
            'booklets' => json_encode($session->booklets),
            '_validTo' => $validUntil,
            'name' => $session->name,
            'mode' => $session->mode,
            'workspaceId' => $session->workspaceId,
            'groupName' => $session->groupName
        ]);
    }



    // TODO add unit-test
    // TODO https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 get customTexts
    // TODO merge with getLogin
    public function getSessionByLoginToken(string $loginToken): TestSession {

        $logindata = $this->_(
            'SELECT 
                logins.booklet_def,
                logins.workspace_id as "workspaceId",
                logins.mode,
                logins.groupname as "groupName",
                logins.name as name,
                logins.valid_until as "_validTo",
                workspaces.name as "workspaceName"
            FROM logins
                INNER JOIN workspaces ON workspaces.id = logins.workspace_id
			WHERE logins.token = :token',
            [':token' => $loginToken]
        );

        if ($logindata !== null) {
            $logindata['booklets'] = JSON::decode($logindata['booklet_def'], true);
            unset($logindata['booklet_def']);
        }

        TimeStamp::checkExpiration(0, Timestamp::fromSQLFormat($logindata['_validTo']));

        return new TestSession($logindata);
    }


    // TODO add unit-test
    // TODO https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 get customTexts
    public function getSessionByPersonToken(string $personToken): TestSession {

        $logindata = $this->_(
            'SELECT 
               logins.booklet_def,
               logins.workspace_id as "workspaceId",
               logins.mode,
               logins.groupname as "groupName",
               logins.token    as "loginToken",
               logins.name,
               workspaces.name as "workspaceName",
               booklets.id     as "testId",
               booklets.label  as "bookletLabel",
               persons.code
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


    // TODO add unit-test
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


    // TODO add unit-test
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

    // TODO unit test
    public function getLogin(string $loginToken): LoginSession {

        $login = $this->_(
            'SELECT 
                    logins.id, 
                    logins.name,
                    logins.workspace_id as "workspaceId",             
                    logins.valid_until as "_validTo",
                    logins.token,
                    logins.mode,
                    logins.booklet_def as "booklets",
                    logins.groupname as "groupName"
                FROM 
                    logins 
                WHERE 
                    logins.token=:token',
            [':token' => $loginToken]
        );

        if ($login == null ){
            throw new HttpError("LoginToken invalid: `$loginToken`", 403);
        }

        TimeStamp::checkExpiration(0, TimeStamp::fromSQLFormat($login['_validTo']));

        $login['_validTo'] = TimeStamp::fromSQLFormat($login['_validTo']);
        $login['booklets'] = JSON::decode($login['booklets'], true);

        return new LoginSession($login);
    }


    public function getLoginId(string $loginToken): int {

        return (int) $this->getLogin($loginToken)->id;
    }


    // TODO unit test
    public function getOrCreatePerson(LoginSession $loginSession, string $code): array {

        $person = $this->_(
            'SELECT * FROM persons WHERE persons.login_id=:id and persons.code=:code',
            [
                ':id' => $loginSession->id,
                ':code' => $code
            ]
        );

        if ($person !== null) {

            TimeStamp::checkExpiration(0, TimeStamp::fromSQLFormat($person['valid_until']));
            return $person;
        }

        return $this->createPerson($loginSession, $code);
    }


    public function createPerson(LoginSession $loginSession, string $code, bool $allowExpired = false): array {

//        $login = $this->getLogin($loginId);



        if (!$allowExpired) {
            TimeStamp::checkExpiration(0, $loginSession->_validTo);
        }

        $newPersonToken = $this->_randomToken('person', $code);
        $validUntil = TimeStamp::toSQLFormat($loginSession->_validTo);

        $this->_(
            'INSERT INTO persons (token, code, login_id, valid_until)
            VALUES(:token, :code, :login_id, :valid_until)',
            [
                ':token' => $newPersonToken,
                ':code' => $code,
                ':login_id' => $loginSession->id,
                ':valid_until' => $validUntil
            ]
        );

        return [
            'id' => (int) $this->pdoDBhandle->lastInsertId(),
            'token' => $newPersonToken,
            'login_id' => $loginSession->id,
            'code' => $code,
            'validTo' => TimeStamp::fromSQLFormat($validUntil),
            'laststate' => null
        ];
    }


    // TODO unit test
    public function canWriteTestData(string $personToken, string $testId): bool {

        $test = $this->_(
            'SELECT booklets.locked FROM booklets
                INNER JOIN persons ON persons.id = booklets.person_id
                WHERE persons.token=:token and booklets.id=:testId',
            [
                ':token' => $personToken,
                ':testId' => $testId
            ]
        );

        // TODO check for mode?!

        return $test and ($test['locked'] != '1');
    }


    // TODO unit test
    public function getPerson(string $personToken): array {

        $person = $this->_(
            'SELECT 
                *
            FROM logins
                     left join persons on (persons.login_id = logins.id)
            WHERE persons.token = :token',
            [
                ':token' => $personToken
            ]
        );

        if ($person == null) {
            throw new HttpError("Invalid Person token: `$personToken`", 403);
        }

        TimeStamp::checkExpiration(0, TimeStamp::fromSQLFormat($person['valid_until']));

        return $person;
    }


    // TODO unit test
    public function getPersonId(string $personToken): int {

        $person = $this->getPerson($personToken);
        return (int) $person['id'];
    }
}

<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class SessionDAO extends DAO {


    public function getLoginSession(string $loginToken): Session {

        $loginData = $this->getLogin($loginToken);

        return new Session(
            $loginData->getToken(),
            "{$loginData->getGroupName()}/{$loginData->getName()}",
            $loginData->isCodeRequired() ? ['codeRequired'] : []
        );
    }


    // TODO add unit-test
    // TODO https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 get customTexts
    public function getPersonSession(string $personToken): Session {

        $loginData = $this->_(
            'SELECT 
               logins.booklet_def,
               logins.workspace_id as "workspaceId",
               logins.mode,
               logins.groupname as "groupName",
               logins.token    as "loginToken",
               logins.name,
               workspaces.name as "workspaceName",
               persons.code
            FROM persons
                 INNER JOIN logins ON logins.id = persons.login_id
                 INNER JOIN workspaces ON workspaces.id = logins.workspace_id
            WHERE persons.token =  :token',
            [':token' => $personToken]
        );


        if ($loginData === null) {
            throw new HttpError("PersonToken invalid: `$personToken`", 403);
        }

        $booklets = JSON::decode($loginData['booklet_def'], true);

        if (!isset($booklets[$loginData['code']])) {
            throw new HttpError("No Booklet found", 404);
        }

        $personsBooklets = $booklets[$loginData['code']] ?? [];
        $personsBookletsAsAccessObjects = array_map(function(string $bookletName): AccessObject {
            return new AccessObject(-1, $bookletName);
        }, $personsBooklets);

        $session = new Session(
            $personToken,
            "{$loginData['groupName']}/{$loginData['name']}/{$loginData['code']}",
            [],
            $loginData['customTexts'] ?? (object) [] // TODO customTexts
        );

        $session->setAccessTest(...$personsBookletsAsAccessObjects);

        return $session;
    }


    public function getOrCreatePersonSession(Login $login, string $code): Session {

        $person = $this->getOrCreatePerson($login, $code);
        $session = new Session(
            $person['token'],
            "{$login->getGroupName()}/{$login->getName()}/{$person['code']}",
            [],
            $login->getCustomTexts()
        );

        $personsBooklets = $login->getBooklets()[$person['code']] ?? [];
        $personsBookletsAsAccessObjects = array_map(function(string $bookletName): AccessObject {
            return new AccessObject(-1, $bookletName);
        }, $personsBooklets);

        $session->setAccessTest(...$personsBookletsAsAccessObjects);

        return $session;
    }


    // TODO add unit-test
    public function getOrCreateLogin(PotentialLogin $loginData): Login {

        $oldLogin = $this->_(
            'SELECT
                    logins.id, 
                    logins.name,
                    logins.workspace_id as "workspaceId",             
                    logins.valid_until as "_validTo",
                    logins.token,
                    logins.mode,
                    logins.booklet_def as "booklets",
                    logins.groupname as "groupName"
            FROM logins
			WHERE logins.name = :name AND logins.workspace_id = :ws', [
                ':name' => $loginData->getName(),
                ':ws' => $loginData->getWorkspaceId()
            ]
        );

        if (($loginData->getMode() == 'run-hot-restart') or ($oldLogin == null)) {

            return $this->createLogin($loginData);
        }

        TimeStamp::checkExpiration(0, (int) TimeStamp::fromSQLFormat($oldLogin['_validTo']));

        // TODO https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 restore customTexts as well

        return new Login(
            $oldLogin['id'],
            $oldLogin['name'],
            $oldLogin['token'],
            $oldLogin['mode'],
            $oldLogin['groupName'],
            JSON::decode($oldLogin['booklets'], true),
            $oldLogin['workspaceId'],
            TimeStamp::fromSQLFormat($oldLogin['_validTo'])
        );
    }


    // TODO https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 get customTexts
    public function getLogin(string $loginToken): Login {

        $login = $this->_(
            'SELECT 
                    logins.id, 
                    logins.name,
                    logins.workspace_id as "workspaceId",             
                    logins.valid_until as "validTo",
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

        TimeStamp::checkExpiration(0, TimeStamp::fromSQLFormat($login['validTo']));

        return new Login(
            (int) $login["id"],
            $login["name"],
            $login["token"],
            $login["mode"],
            $login["groupName"],
            JSON::decode($login['booklets'], true),
            (int) $login["workspaceId"],
            TimeStamp::fromSQLFormat($login['validTo'])
        );
    }


    protected function createLogin(PotentialLogin $loginData, bool $allowExpired = false): Login {

        if (!$allowExpired) {
            TimeStamp::checkExpiration($loginData->getValidFrom(), $loginData->getValidTo());
        }

        $validUntil = TimeStamp::expirationFromNow($loginData->getValidTo(), $loginData->getValidForMinutes());

        $loginToken = $this->_randomToken('login', $loginData->getName());

        $this->_(
            'INSERT INTO logins (token, booklet_def, valid_until, name, mode, workspace_id, groupname) 
                VALUES(:token, :sd, :valid_until, :name, :mode, :ws, :groupname)',
            [
                ':token' => $loginToken,
                ':sd' => json_encode($loginData->getBooklets()),
                ':valid_until' => TimeStamp::toSQLFormat($validUntil),
                ':name' => $loginData->getName(),
                ':mode' => $loginData->getMode(),
                ':ws' => $loginData->getWorkspaceId(),
                ':groupname' => $loginData->getGroupName()
            ]
        );

        return new Login(
            (int) $this->pdoDBhandle->lastInsertId(),
            $loginData->getName(),
            $loginToken,
            $loginData->getMode(),
            $loginData->getGroupName(),
            $loginData->getBooklets(),
            (int) $loginData->getWorkspaceId(),
            $validUntil
        );
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

        $person = $this->getPerson($personToken);

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


    protected function getOrCreatePerson(Login $loginSession, string $code): array {

        $person = $this->_(
            'SELECT * FROM persons WHERE persons.login_id=:id and persons.code=:code',
            [
                ':id' => $loginSession->getId(),
                ':code' => $code
            ]
        );

        if ($person !== null) {

            TimeStamp::checkExpiration(0, TimeStamp::fromSQLFormat($person['valid_until']));
            return $person;
        }

        return $this->createPerson($loginSession, $code);
    }


    public function createPerson(Login $login, string $code, bool $allowExpired = false): array {

        if (!array_key_exists($code, $login->getBooklets())) {
            throw new HttpError("`$code` is no valid code for `{$login->getName()}`", 401);
        }

        if (!$allowExpired) {
            TimeStamp::checkExpiration(0, $login->getValidTo());
        }

        $newPersonToken = $this->_randomToken('person', "{$login->getGroupName()}_{$login->getName()}_$code");
        $validUntil = TimeStamp::toSQLFormat($login->getValidTo());

        $this->_(
            'INSERT INTO persons (token, code, login_id, valid_until)
            VALUES(:token, :code, :login_id, :valid_until)',
            [
                ':token' => $newPersonToken,
                ':code' => $code,
                ':login_id' => $login->getId(),
                ':valid_until' => $validUntil
            ]
        );

        return [
            'id' => (int) $this->pdoDBhandle->lastInsertId(),
            'token' => $newPersonToken,
            'login_id' => $login->getId(),
            'code' => $code,
            'validTo' => TimeStamp::fromSQLFormat($validUntil),
            'laststate' => null
        ];
    }
}

<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class SessionDAO extends DAO {


    public function getToken(string $tokenString, array $requiredTypes): AuthToken {

        $tokenInfo = $this->_(
            'select
                    *
            from (
                select
                    admintokens.id as token,
                    users.id,
                    \'admin\' as type,
                    -1 as workspaceId,
                    case when (users.is_superadmin > 0) then \'super-admin\' else \'admin\' end as "mode",
                    valid_until as "validTo"
                from admintokens
                    inner join users on (users.id = admintokens.user_id)
                union
                select
                    token,
                    logins.id as "id",
                    \'login\' as "type",
                    workspace_id as "workspaceId",
                    logins.mode,
                    valid_until as "validTo"
                FROM logins
                union
                select
                    persons.token,
                    persons.id as "id",
                    \'person\' as "type",
                    workspace_id as "workspaceId",
                    logins.mode,
                    persons.valid_until as "validTo"
                from logins
                    inner join persons on (persons.login_id = logins.id)
            ) as allTokenTables
            where 
                token = :token',
            [':token' => $tokenString]
        );

        if ($tokenInfo == null) {

            throw new HttpError("Invalid token: `$tokenString`", 403);
        }

        if (!in_array($tokenInfo["type"], $requiredTypes)) {

            throw new HttpError("Token `{$tokenString}` of type `{$tokenInfo["type"]}` hat insufficient rights", 403);
        }

        TimeStamp::checkExpiration(0, TimeStamp::fromSQLFormat($tokenInfo['validTo']));

        return new AuthToken(
            $tokenInfo['token'],
            (int) $tokenInfo['id'],
            $tokenInfo['type'],
            (int) $tokenInfo['workspaceId'],
            $tokenInfo['mode']
        );
    }



    public function getLoginSession(string $loginToken): Session {

        $loginData = $this->getLogin($loginToken);

        return new Session(
            $loginData->getToken(),
            "{$loginData->getGroupName()}/{$loginData->getName()}",
            $loginData->isCodeRequired() ? ['codeRequired'] : [],
            $loginData->getCustomTexts()
        );
    }


    // TODO add unit-test
    public function getPersonSession(string $personToken): Session {

        $loginData = $this->_(
            'SELECT 
               logins.booklet_def,
               logins.workspace_id as "workspaceId",
               logins.mode,
               logins.groupname as "groupName",
               logins.token    as "loginToken",
               logins.name,
               logins.customTexts,
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

        $session = new Session(
            $personToken,
            "{$loginData['groupName']}/{$loginData['name']}/{$loginData['code']}",
            [],
            JSON::decode($loginData['customTexts']) ?? (object) []
        );

        $session->setAccessTest(...$personsBooklets);

        return $session;
    }


    // TODO unit-test
    public function getOrCreatePersonSession(Login $login, string $code = ''): Session {

        $person = $this->getOrCreatePerson($login, $code);
        $session = new Session(
            $person['token'],
            "{$login->getGroupName()}/{$login->getName()}/{$person['code']}",
            [],
            $login->getCustomTexts()
        );

        $personsBooklets = $login->getBooklets()[$person['code']] ?? [];

        $session->setAccessTest(...$personsBooklets);

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
                    logins.groupname as "groupName",
                    logins.customTexts
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
        error_log('XXX:'. print_r(JSON::decode($oldLogin['customTexts']), true));
        return new Login(
            (int) $oldLogin['id'],
            $oldLogin['name'],
            $oldLogin['token'],
            $oldLogin['mode'],
            $oldLogin['groupName'],
            JSON::decode($oldLogin['booklets'], true),
            (int) $oldLogin['workspaceId'],
            TimeStamp::fromSQLFormat($oldLogin['_validTo']),
            JSON::decode($oldLogin['customTexts'])
        );
    }


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
                    logins.groupname as "groupName",
                    logins.customTexts
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
            TimeStamp::fromSQLFormat($login['validTo']),
            JSON::decode($login["customTexts"])
        );
    }


    // TODO unit-test
    protected function createLogin(PotentialLogin $loginData, bool $allowExpired = false): Login {

        if (!$allowExpired) {
            TimeStamp::checkExpiration($loginData->getValidFrom(), $loginData->getValidTo());
        }

        $validUntil = TimeStamp::expirationFromNow($loginData->getValidTo(), $loginData->getValidForMinutes());

        $loginToken = $this->_randomToken('login', $loginData->getName());

        $this->_(
            'INSERT INTO logins (token, booklet_def, valid_until, name, mode, workspace_id, groupname, customTexts) 
                VALUES(:token, :sd, :valid_until, :name, :mode, :ws, :groupname, :customTexts)',
            [
                ':token' => $loginToken,
                ':sd' => json_encode($loginData->getBooklets()),
                ':valid_until' => TimeStamp::toSQLFormat($validUntil),
                ':name' => $loginData->getName(),
                ':mode' => $loginData->getMode(),
                ':ws' => $loginData->getWorkspaceId(),
                ':groupname' => $loginData->getGroupName(),
                ':customTexts' => json_encode($loginData->getCustomTexts())
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


    // TODO unit-test
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


    // TODO unit-test
    public function createPerson(Login $login, string $code, bool $allowExpired = false): array {

        if (!array_key_exists($code, $login->getBooklets())) {
            throw new HttpError("`$code` is no valid code for `{$login->getName()}`", 400);
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

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
                        admin_sessions.token,
                        users.id,
                        \'admin\' as "type",
                        -1 as "workspaceId",
                        case when (users.is_superadmin) then \'super-admin\' else \'admin\' end as "mode",
                        valid_until as "validTo"
                    from admin_sessions
                        inner join users on (users.id = admin_sessions.user_id)
                    union
                    select
                        token,
                        login_sessions.id as "id",
                        \'login\' as "type",
                        workspace_id as "workspaceId",
                        login_sessions.mode,
                        valid_until as "validTo"
                    FROM login_sessions
                    union
                    select
                        person_sessions.token,
                        person_sessions.id as "id",
                        \'person\' as "type",
                        workspace_id as "workspaceId",
                        login_sessions.mode,
                        person_sessions.valid_until as "validTo"
                    from login_sessions
                        inner join person_sessions on (person_sessions.login_id = login_sessions.id)
                ) as allTokenTables
            where 
                token = :token',
            [':token' => $tokenString]
        );

        if ($tokenInfo == null) {

            throw new HttpError("Invalid token: `$tokenString`", 403);
        }

        if (!in_array($tokenInfo["type"], $requiredTypes)) {

            throw new HttpError("Token `{$tokenString}` of "
                . "type `{$tokenInfo["type"]}` has wrong type - `"
                . implode($requiredTypes, "` or `") . "` required.", 403);
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
               login_sessions.codes_to_booklets,
               login_sessions.workspace_id as "workspaceId",
               login_sessions.mode,
               login_sessions.group_name as "groupName",
               login_sessions.token    as "loginToken",
               login_sessions.name,
               login_sessions.custom_texts as "customTexts",
               workspaces.name as "workspaceName",
               person_sessions.code
            FROM person_sessions
                 INNER JOIN login_sessions ON login_sessions.id = person_sessions.login_id
                 INNER JOIN workspaces ON workspaces.id = login_sessions.workspace_id
            WHERE person_sessions.token =  :token',
            [':token' => $personToken]
        );

        if ($loginData === null) {
            throw new HttpError("PersonToken invalid: `$personToken`", 403);
        }

        $session = new Session(
            $personToken,
            "{$loginData['groupName']}/{$loginData['name']}/{$loginData['code']}",
            [],
            JSON::decode($loginData['customTexts']) ?? (object) []
        );

        switch ($loginData['mode']) {

            case "monitor-study":
                $session->addAccessObjects('workspaceMonitor', (string) $loginData['workspaceId']);
                break;

            case "monitor-group":
                $session->addAccessObjects('workspaceTest', (string) $loginData['workspaceId']);
                break;

            default:
                $booklets = JSON::decode($loginData['codes_to_booklets'], true);
                if (!isset($booklets[$loginData['code']])) {
                    throw new HttpError("No Booklet found", 404);
                }
                $personsBooklets = $booklets[$loginData['code']] ?? [];
                $session->addAccessObjects('test', ...$personsBooklets);
                break;
        }

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

        switch ($login->getMode()) {

            case "monitor-study":
                $session->addAccessObjects('workspaceMonitor', (string) $login->getWorkspaceId());
                break;

            case "monitor-group":
                $session->addAccessObjects('testMonitor', (string) $login->getWorkspaceId());
                break;

            default:
                $personsBooklets = $login->getBooklets()[$person['code']] ?? [];
                $session->addAccessObjects('test', ...$personsBooklets);
                break;
        }

        return $session;
    }


    // TODO add unit-test
    public function getOrCreateLogin(PotentialLogin $loginData): Login {

        $oldLogin = $this->_(
            'SELECT
                    login_sessions.id, 
                    login_sessions.name,
                    login_sessions.workspace_id as "workspaceId",             
                    login_sessions.valid_until as "_validTo",
                    login_sessions.token,
                    login_sessions.mode,
                    login_sessions.codes_to_booklets as "booklets",
                    login_sessions.group_name as "groupName",
                    login_sessions.custom_texts as "customTexts"
            FROM login_sessions
			WHERE login_sessions.name = :name AND login_sessions.workspace_id = :ws', [
                ':name' => $loginData->getName(),
                ':ws' => $loginData->getWorkspaceId()
            ]
        );

        if (($loginData->getMode() == 'run-hot-restart') or ($oldLogin == null)) {

            return $this->createLogin($loginData);
        }

        TimeStamp::checkExpiration(0, (int) TimeStamp::fromSQLFormat($oldLogin['_validTo']));

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
                    login_sessions.id, 
                    login_sessions.name,
                    login_sessions.workspace_id as "workspaceId",             
                    login_sessions.valid_until as "validTo",
                    login_sessions.token,
                    login_sessions.mode,
                    login_sessions.codes_to_booklets as "booklets",
                    login_sessions.group_name as "groupName",
                    login_sessions.custom_texts as "customTexts"
                FROM 
                    login_sessions 
                WHERE 
                    login_sessions.token=:token',
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
            'INSERT INTO login_sessions (token, codes_to_booklets, valid_until, name, mode, workspace_id, group_name, custom_texts) 
                VALUES(:token, :sd, :valid_until, :name, :mode, :ws, :groupname, :custom_texts)',
            [
                ':token' => $loginToken,
                ':sd' => json_encode($loginData->getBooklets()),
                ':valid_until' => TimeStamp::toSQLFormat($validUntil),
                ':name' => $loginData->getName(),
                ':mode' => $loginData->getMode(),
                ':ws' => $loginData->getWorkspaceId(),
                ':groupname' => $loginData->getGroupName(),
                ':custom_texts' => json_encode($loginData->getCustomTexts())
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
            $validUntil,
            $loginData->getCustomTexts()
        );
    }


    // TODO add unit-test
    public function personHasBooklet(string $personToken, string $bookletName): bool {

        $bookletDef = $this->_('
            SELECT login_sessions.codes_to_booklets, login_sessions.id, person_sessions.code
            FROM login_sessions
                     left join person_sessions on (login_sessions.id = person_sessions.login_id)
            WHERE person_sessions.token = :token',
            [
                ':token' => $personToken
            ]
        );

        $code = $bookletDef['code'];
        $codes2booklets = JSON::decode($bookletDef['codes_to_booklets'], true);

        return $codes2booklets and isset($codes2booklets[$code]) and in_array($bookletName, $codes2booklets[$code]);
    }


    // TODO add unit-test
    public function getBookletStatus(string $personToken, string $bookletName): array {

        $person = $this->getPerson($personToken);

        $test = $this->_(
            'SELECT tests.laststate, tests.locked, tests.label, tests.id FROM tests
            WHERE tests.person_id = :personid and tests.name = :bookletname',
            [
                ':personid' => $person['id'],
                ':bookletname' => $bookletName
            ]
        );

        if ($test !== null) {

            return [
                'running' => true,
                'locked' => (bool) $test['locked'],
                'label' => $test['label']
            ];

        } else {

            return [
                'running' => false,
                'locked' => false,
                'label' => ""
            ];
        }
    }


    // TODO unit test
    public function canWriteTestData(string $personToken, string $testId): bool {

        $test = $this->_(
            'SELECT tests.locked FROM tests
                INNER JOIN person_sessions ON person_sessions.id = tests.person_id
                WHERE person_sessions.token=:token and tests.id=:testId',
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
            FROM login_sessions
                     left join person_sessions on (person_sessions.login_id = login_sessions.id)
            WHERE person_sessions.token = :token',
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
            'SELECT * FROM person_sessions WHERE person_sessions.login_id=:id and person_sessions.code=:code',
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

        if (count($login->getBooklets()) and !array_key_exists($code, $login->getBooklets())) {
            throw new HttpError("`$code` is no valid code for `{$login->getName()}`", 400);
        }

        if (!$allowExpired) {
            TimeStamp::checkExpiration(0, $login->getValidTo());
        }

        $newPersonToken = $this->_randomToken('person', "{$login->getGroupName()}_{$login->getName()}_$code");
        $validUntil = TimeStamp::toSQLFormat($login->getValidTo());

        $this->_(
            'INSERT INTO person_sessions (token, code, login_id, valid_until)
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

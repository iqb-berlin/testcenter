<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class AdminDAO extends DAO {


    public function getAdminSession(string $adminToken): Session {

        $admin = $this->getAdmin($adminToken);
        $session = new Session(
            $admin['adminToken'],
            $admin['name']
        );

        $workspacesIds = array_map(function($workspace) {
            return (string) $workspace['id'];
        }, $this->getWorkspaces($adminToken));

        $session->addAccessObjects('workspaceAdmin', ...$workspacesIds);

        if ($admin["isSuperadmin"]) {
            $session->addAccessObjects('superAdmin');
        }

        return $session;
    }


    public function refreshAdminToken(string $token): void {

        $this->_(
            'UPDATE admin_sessions 
            SET valid_until =:value
            WHERE token =:token',
            [
                ':value' => TimeStamp::toSQLFormat(TimeStamp::expirationFromNow(0, $this->timeUserIsAllowedInMinutes)),
                ':token'=> $token
            ]
        );
    }


	public function createAdminToken(string $username, string $password, ?int $validTo = null): string {

		if ((strlen($username) == 0) or (strlen($username) > 50)) {
			throw new Exception("Invalid Username `$username`", 400);
		}

		$user = $this->getUserByNameAndPassword($username, $password);

		$this->deleteTokensByUser((int) $user['id']);

		$token = $this->randomToken('admin', $username);

		$this->storeToken((int) $user['id'], $token, $validTo);

		return $token;
	}


    private function getUserByNameAndPassword(string $userName, string $password): ?array {

        $usersOfThisName = $this->_(
            'SELECT * FROM users WHERE users.name = :name',
            [':name' => $userName],
            true
        );

        // we always check at least one user to not leak the existence of username to time-attacks
        $usersOfThisName = (!count($usersOfThisName)) ? [['password' => 'dummy']] : $usersOfThisName;

        foreach ($usersOfThisName as $user) {

            if (Password::verify($password, $user['password'], $this->passwordSalt)) {
                return $user;
            }
        }

        // generic error message to not expose too much information to attackers
        $shortPW = preg_replace('/(^.).*(.$)/m', '$1***$2', $password);
        throw new HttpError("Invalid Password `$shortPW` or unknown user `$userName`.", 400);
    }


	private function deleteTokensByUser(int $userId): void {

		$this->_(
			'DELETE FROM admin_sessions WHERE admin_sessions.user_id = :id',
			[':id' => $userId]
		);
	}


	private function storeToken(int $userId, string $token, ?int $validTo = null): void {

        $validTo = $validTo ?? TimeStamp::expirationFromNow(0, $this->timeUserIsAllowedInMinutes);

		$this->_(
			'INSERT INTO admin_sessions (token, user_id, valid_until) 
			VALUES(:token, :user_id, :valid_until)',
			[
				':token' => $token,
				':user_id' => $userId,
				':valid_until' => TimeStamp::toSQLFormat($validTo)
			]
		);
	}


	public function logout($token) {

		$this->_(
			'DELETE FROM admin_sessions 
			WHERE admin_sessions.token=:token',
			[':token' => $token]
		);
		// TODO check this function carefully
		// original description was "deletes all tokens of this user", what is not what this function does
		// check where this is used at all and which behavior exactly was intended
        // then: write unit test
	}


	public function getAdmin(string $token): array {

		$tokenInfo = $this->_(
			'SELECT 
                users.id as "userId",
                users.name,
                users.email as "userEmail",
                users.is_superadmin as "isSuperadmin",
                admin_sessions.valid_until as "_validTo",
                admin_sessions.token as "adminToken"
            FROM users
			INNER JOIN admin_sessions ON users.id = admin_sessions.user_id
			WHERE admin_sessions.token=:token',
			[':token' => $token]
		);

		if (!$tokenInfo) {
            throw new HttpError("Token not valid! ($token)", 403);
        }

        TimeStamp::checkExpiration(0, TimeStamp::fromSQLFormat($tokenInfo['_validTo']));

        $tokenInfo['userEmail'] = $tokenInfo['userEmail'] ?? '';

        return $tokenInfo;
	}


	public function changeBookletLockStatus(int $workspace_id, string $group_name, bool $lock): void { // TODO write unit test

		$lockStr = $lock ? '1' : '0';

		$this->_(
			'UPDATE tests SET locked=:locked WHERE id IN (
                SELECT inner_select.id from (
                    SELECT tests.id FROM tests
                        INNER JOIN person_sessions ON (person_sessions.id = tests.person_id)
                        INNER JOIN login_sessions ON (person_sessions.login_id = login_sessions.id)
                        INNER JOIN workspaces ON (login_sessions.workspace_id = workspaces.id)
                        WHERE workspaces.id=:workspace_id AND login_sessions.group_name=:groupname
                    ) as inner_select
                )',
			[
				':locked' => $lockStr,
				':workspace_id' => $workspace_id,
				':groupname' => $group_name
            ]
		);
	}


	public function deleteResultData(int $workspaceId, string $groupName): void { // TODO write unit test

		$this->_(
			'DELETE FROM login_sessions
			WHERE login_sessions.workspace_id=:workspace_id and login_sessions.group_name = :groupname',
			[
				':workspace_id' => $workspaceId,
				':groupname' => $groupName
			]
		);
	}


	public function getWorkspaces(string $token): array {

		$data = $this->_(
			'SELECT workspaces.id, workspaces.name, workspace_users.role FROM workspaces
				INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
				INNER JOIN users ON workspace_users.user_id = users.id
				INNER JOIN admin_sessions ON  users.id = admin_sessions.user_id
				WHERE admin_sessions.token =:token',
			[':token' => $token],
			true
		);

		return $data;
	}


	public function hasAdminAccessToWorkspace(string $token, int $workspaceId): bool {

		$data = $this->_(
			'SELECT workspaces.id FROM workspaces
				INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
				INNER JOIN users ON workspace_users.user_id = users.id
				INNER JOIN admin_sessions ON  users.id = admin_sessions.user_id
				WHERE admin_sessions.token =:token and workspaces.id = :wsId',
			[
				':token' => $token,
				':wsId' => $workspaceId
			]
		);

		return $data != false;
	}


    public function hasMonitorAccessToWorkspace(string $token, int $workspaceId): bool {

        $data = $this->_(
            'SELECT workspaces.id FROM workspaces
				INNER JOIN login_sessions ON workspaces.id = login_sessions.workspace_id
				INNER JOIN person_sessions ON person_sessions.login_id = login_sessions.id
				WHERE person_sessions.token =:token and workspaces.id = :wsId',
            [
                ':token' => $token,
                ':wsId' => $workspaceId
            ]
        );

        return $data != false;
    }


	public function getWorkspaceRole(string $token, int $workspaceId): string {

		$user = $this->_(
			'SELECT workspace_users.role FROM workspaces
				INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
				INNER JOIN users ON workspace_users.user_id = users.id
				INNER JOIN admin_sessions ON  users.id = admin_sessions.user_id
				WHERE admin_sessions.token =:token and workspaces.id = :wsId',
			[
				':token' => $token,
				':wsId' => $workspaceId
            ]
		);

		return $user['role'] ?? '';
	}


	public function getResultsCount(int $workspaceId): array { // TODO add unit test  // TODO use dataclass an camelCase-objects

		return $this->_(
			'SELECT login_sessions.group_name as groupname, login_sessions.name as loginname, person_sessions.code,
				tests.name as bookletname, COUNT(distinct units.id) AS num_units,
				MAX(units.responses_ts) as lastchange
			FROM tests
				INNER JOIN person_sessions ON person_sessions.id = tests.person_id
				INNER JOIN login_sessions ON login_sessions.id = person_sessions.login_id
				INNER JOIN units ON units.booklet_id = tests.id
			WHERE login_sessions.workspace_id =:workspaceId
			GROUP BY tests.name, login_sessions.group_name, login_sessions.name, person_sessions.code',
			[
				':workspaceId' => $workspaceId
			],
			true
		);
	}


    public function getBookletsStarted($workspaceId): array { // TODO add unit test  // TODO use dataclass and camelCase-objects

        return $this->_(
            'SELECT login_sessions.group_name as groupname, login_sessions.name as loginname, person_sessions.code, 
					tests.name as bookletname, tests.locked,
					login_sessions.valid_until as lastlogin, person_sessions.valid_until as laststart
				FROM tests
				INNER JOIN person_sessions ON person_sessions.id = tests.person_id
				INNER JOIN login_sessions ON login_sessions.id = person_sessions.login_id
				WHERE login_sessions.workspace_id = :workspaceId and tests.running = 1',
            [
                ':workspaceId' => $workspaceId
            ],
            true
        );
    }


	public function getTestSessions(int $workspaceId, array $groups): SessionChangeMessageArray { // TODO add unit test

        $replacements = [];

        if (count($groups)) {

            foreach ($groups as $index => $group) {

                $replacements[":group_$index"] = $group;
            }

            $in = implode(',', array_keys($replacements));
        }

        $replacements[':workspaceId'] = $workspaceId;

        $sql = 'SELECT
                 person_sessions.id as "personId",
                 login_sessions.name as "loginName",
                 login_sessions.group_name as "groupName",
                 login_sessions.mode,
                 person_sessions.code,
                 tests.id as "testId",
                 tests.name as "bookletName",
                 tests.locked,
                 tests.laststate as "testState"
            FROM person_sessions
                 LEFT JOIN tests ON person_sessions.id = tests.person_id
                 LEFT JOIN login_sessions ON login_sessions.id = person_sessions.login_id
            WHERE login_sessions.workspace_id = :workspaceId'
            . (count($groups) ? " AND login_sessions.group_name IN ($in)" : '');

		$testSessionsData = $this->_($sql, $replacements,true);

        $sessionChangeMessages = new SessionChangeMessageArray();

		foreach ($testSessionsData as $testSession) {

		    $sessionChangeMessage = new SessionChangeMessage((int) $testSession['personId'], $testSession['groupName']);
		    $sessionChangeMessage->setLogin(
                $testSession['loginName'],
                $testSession['mode'],
                ucfirst(str_replace('_', " ", $testSession['groupName'])),
                $testSession['code']
            );

		    if ($testSession['testId']) {

                $testState = $this->getTestFullState($testSession);

                $sessionChangeMessage->setTestState(
                    (int) $testSession['testId'],
                    $testState,
                    $testSession['bookletName'] ?? ""
                );

                $unit = $this->getLastUnit((int) $testSession['testId']);

                $sessionChangeMessage->setUnitState(
                    $unit['name'],
                    $unit['state']
                );
            }

            $sessionChangeMessages->add($sessionChangeMessage);
        }

		return $sessionChangeMessages;
	}


	private function getTestFullState(array $testSessionData): array {

        $testState = JSON::decode($testSessionData['testState'], true);

        if ($testSessionData['locked']) {
            $testState['status'] = 'locked';
        }

        return $testState;
    }


	private function getLastUnit(int $testId): array {

        $unitData = $this->_("select
                name,
                laststate
            from
                units 
            where
                units.booklet_id = :testId
            order by id desc limit 1", // TODO we take the last inserted unit, which is only the last one if ...
            // the testee never went back. but atm we have no other way to find out the real last seen one ...
            // see: https://github.com/iqb-berlin/testcenter-frontend/issues/181
            [':testId' => $testId]
        );

        if (!$unitData) {
            return [
                'name' => '',
                'state' => []
            ];
        }

        $state = JSON::decode($unitData['laststate'], true) ?? [];

        return [
            'name' => $unitData['name'],
            'state' => $state ?? []
        ];
    }


	public function getBookletsResponsesGiven($workspaceId) { // TODO add unit test // TODO use dataclass an camelCase-objects

		return $this->_(
			'SELECT DISTINCT tests.name as bookletname, person_sessions.code, login_sessions.name as loginname,
					login_sessions.group_name as groupname FROM units
			INNER JOIN tests ON tests.id = units.booklet_id
			INNER JOIN person_sessions ON person_sessions.id = tests.person_id 
			INNER JOIN login_sessions ON login_sessions.id = person_sessions.login_id
			INNER JOIN workspaces ON workspaces.id = login_sessions.workspace_id
            WHERE workspace_id =:workspaceId			
            ORDER BY login_sessions.group_name, login_sessions.name, person_sessions.code, tests.name
			',
			[
				':workspaceId' => $workspaceId
			],
			true
		);
	}


	public function getResponses($workspaceId, $groups) { // TODO add unit test // TODO use dataclass an camelCase-objects

		$groupsString = implode("','", $groups);
		return $this->_(
			"SELECT units.name as unitname, units.responses, units.responsetype, units.laststate, tests.name as bookletname,
					units.restorepoint_ts, units.responses_ts,
					units.restorepoint, login_sessions.group_name as groupname, login_sessions.name as loginname, person_sessions.code
			FROM units
			INNER JOIN tests ON tests.id = units.booklet_id
			INNER JOIN person_sessions ON person_sessions.id = tests.person_id 
			INNER JOIN login_sessions ON login_sessions.id = person_sessions.login_id
			WHERE login_sessions.workspace_id =:workspaceId AND login_sessions.group_name IN ('$groupsString')",
			[
				':workspaceId' => $workspaceId,
			],
			true
		);
	}

	// $return = []; groupname, loginname, code, bookletname, unitname, timestamp, logentry
	public function getLogs($workspaceId, $groups) { // TODO add unit test // TODO use dataclass an camelCase-objects

		$groupsString = implode("','", $groups);

		$unitData = $this->_(
			"SELECT 
                units.name as unitname, 
                tests.name as bookletname,
				login_sessions.group_name as groupname, 
                login_sessions.name as loginname, 
                person_sessions.code,
				unit_logs.timestamp, 
                unit_logs.logentry
			FROM unit_logs
			INNER JOIN units ON units.id = unit_logs.unit_id
			INNER JOIN tests ON tests.id = units.booklet_id
			INNER JOIN person_sessions ON person_sessions.id = tests.person_id 
			INNER JOIN login_sessions ON login_sessions.id = person_sessions.login_id
			WHERE login_sessions.workspace_id =:workspaceId AND login_sessions.group_name IN ('$groupsString')",
			[
				':workspaceId' => $workspaceId
			],
			true
		);

		$bookletData = $this->_(
			"SELECT tests.name as bookletname,
					login_sessions.group_name as groupname, login_sessions.name as loginname, person_sessions.code,
					test_logs.timestamp, test_logs.logentry
			FROM test_logs
			INNER JOIN tests ON tests.id = test_logs.booklet_id
			INNER JOIN person_sessions ON person_sessions.id = tests.person_id 
			INNER JOIN login_sessions ON login_sessions.id = person_sessions.login_id
			WHERE login_sessions.workspace_id =:workspaceId AND login_sessions.group_name IN ('$groupsString')",
			[
				':workspaceId' => $workspaceId
			],
			true
		);

		foreach ($bookletData as $bd) {
			$bd['unitname'] = '';
			array_push($unitData, $bd);
		}

		return $unitData;
	}

	// $return = []; groupname, loginname, code, bookletname, unitname, priority, categories, entry
	public function getReviews($workspaceId, $groups) { // TODO add unit test

		$groupsString = implode("','", $groups);

		$unitData = $this->_(
			"SELECT units.name as unitname, tests.name as bookletname,
					login_sessions.group_name as groupname, login_sessions.name as loginname, person_sessions.code,
					unit_reviews.reviewtime, unit_reviews.entry,
					unit_reviews.priority, unit_reviews.categories
			FROM unit_reviews
			INNER JOIN units ON units.id = unit_reviews.unit_id
			INNER JOIN tests ON tests.id = units.booklet_id
			INNER JOIN person_sessions ON person_sessions.id = tests.person_id 
			INNER JOIN login_sessions ON login_sessions.id = person_sessions.login_id
			WHERE login_sessions.workspace_id =:workspaceId AND login_sessions.group_name IN ('$groupsString')",
			[
				':workspaceId' => $workspaceId
			],
			true
		);

		$bookletData = $this->_(
			"SELECT tests.name as bookletname,
					login_sessions.group_name as groupname, login_sessions.name as loginname, person_sessions.code,
					test_reviews.reviewtime, test_reviews.entry,
					test_reviews.priority, test_reviews.categories
			FROM test_reviews
			INNER JOIN tests ON tests.id = test_reviews.booklet_id
			INNER JOIN person_sessions ON person_sessions.id = tests.person_id 
			INNER JOIN login_sessions ON login_sessions.id = person_sessions.login_id
			WHERE login_sessions.workspace_id =:workspaceId AND login_sessions.group_name IN ('$groupsString')",
			[
				':workspaceId' => $workspaceId
			],
			true
		);

		foreach ($bookletData as $bd) {
			$bd['unitname'] = '';
			array_push($unitData, $bd);
		}

		return $unitData;
	}


    public function getAssembledResults(int $workspaceId): array {

        $keyedReturn = [];

        foreach($this->getResultsCount($workspaceId) as $resultSet) {
            // groupname, loginname, code, bookletname, num_units
            if (!isset($keyedReturn[$resultSet['groupname']])) {
                $keyedReturn[$resultSet['groupname']] = [
                    'groupname' => $resultSet['groupname'],
                    'bookletsStarted' => 1,
                    'num_units_min' => $resultSet['num_units'],
                    'num_units_max' => $resultSet['num_units'],
                    'num_units_total' => $resultSet['num_units'],
                    'lastchange' => $resultSet['lastchange']
                ];
            } else {
                $keyedReturn[$resultSet['groupname']]['bookletsStarted'] += 1;
                $keyedReturn[$resultSet['groupname']]['num_units_total'] += $resultSet['num_units'];
                if ($resultSet['num_units'] > $keyedReturn[$resultSet['groupname']]['num_units_max']) {
                    $keyedReturn[$resultSet['groupname']]['num_units_max'] = $resultSet['num_units'];
                }
                if ($resultSet['num_units'] < $keyedReturn[$resultSet['groupname']]['num_units_min']) {
                    $keyedReturn[$resultSet['groupname']]['num_units_min'] = $resultSet['num_units'];
                }
                if ($resultSet['lastchange'] > $keyedReturn[$resultSet['groupname']]['lastchange']) {
                    $keyedReturn[$resultSet['groupname']]['lastchange'] = $resultSet['lastchange'];
                }
            }
        }

        $returner = [];

        // get rid of the key and calculate mean
        foreach($keyedReturn as $group => $groupData) {
            $groupData['num_units_mean'] = $groupData['num_units_total'] / $groupData['bookletsStarted'];
            array_push($returner, $groupData);
        }

        return $returner;
    }


    public function storeCommand(int $commanderId, int $testId, Command $command): Command {

        $this->_("insert into test_commands (test_id, keyword, parameter, commander_id, timestamp) 
                values (:test_id, :keyword, :parameter, :commander_id, :timestamp)",
                [
                    ':test_id'      => $testId,
                    ':keyword'      => $command->getKeyword(),
                    ':parameter'    => json_encode($command->getArguments()),
                    ':commander_id' => $commanderId,
                    ':timestamp'    => TimeStamp::toSQLFormat($command->getTimestamp())
                ]);

        return new Command(
            (int) $this->pdoDBhandle->lastInsertId(),
            $command->getKeyword(),
            $command->getTimestamp(),
            ...$command->getArguments()
        );
    }


    // TODO use typed class instead of array
    public function getTest(int $testId): ?array {

        return $this->_(
            'SELECT tests.locked, tests.id, tests.laststate, tests.label FROM tests WHERE tests.id=:id',
            [':id' => $testId]
        );
    }
}

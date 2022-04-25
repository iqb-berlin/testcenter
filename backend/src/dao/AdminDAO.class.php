<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class AdminDAO extends DAO {

    public function getAdminAccessSet(string $adminToken): AccessSet {

        $admin = $this->getAdmin($adminToken);
        $accessSet = new AccessSet(
            $admin['adminToken'],
            $admin['name']
        );

        $workspacesIds = array_map(function($workspace) {
            return (string) $workspace['id'];
        }, $this->getWorkspaces($adminToken));

        $accessSet->addAccessObjects('workspaceAdmin', ...$workspacesIds);

        if ($admin["isSuperadmin"]) {
            $accessSet->addAccessObjects('superAdmin');
        }

        return $accessSet;
    }


    /**
     * @codeCoverageIgnore
     */
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


	public function deleteResultData(int $workspaceId, string $groupName): void {

		$this->_(
            "delete from login_sessions where group_name = :group_name and workspace_id = :workspace_id",
			[
				':workspace_id' => $workspaceId,
				':group_name' => $groupName
			]
		);
	}


	public function getWorkspaces(string $token): array {

        return $this->_(
            'SELECT workspaces.id, workspaces.name, workspace_users.role FROM workspaces
                INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
                INNER JOIN users ON workspace_users.user_id = users.id
                INNER JOIN admin_sessions ON  users.id = admin_sessions.user_id
                WHERE admin_sessions.token =:token',
            [':token' => $token],
            true
        );
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
				INNER JOIN person_sessions ON person_sessions.login_sessions_id = login_sessions.id
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


	public function getTestSessions(int $workspaceId, array $groups): SessionChangeMessageArray {

        $groupSelector = false;
        if (count($groups)) {

            $groupSelector = "'" . implode("', '", $groups) . "'";
        }

        $modeSelector = "'" . implode("', '", Mode::getByCapability('monitorable')) . "'";

        $sql = 'SELECT
                 person_sessions.id as "person_id",
                 login_sessions.name as "loginName",
                 login_sessions.id as "login_sessions_id",
                 logins.name,
                 logins.mode,
                 logins.group_name,
                 logins.group_label,
                 logins.workspace_id,
                 person_sessions.code,
                 person_sessions.name_suffix,
                 tests.id as "test_id",
                 tests.name as "booklet_name",
                 tests.locked,
                 tests.running,
                 tests.laststate as "testState",
                 tests.timestamp_server as "test_timestamp_server"
            FROM person_sessions
                 LEFT JOIN tests ON person_sessions.id = tests.person_id
                 LEFT JOIN login_sessions ON login_sessions.id = person_sessions.login_sessions_id
                 LEFt JOIN logins on logins.name = login_sessions.name
            WHERE
                login_sessions.workspace_id = :workspaceId
                AND tests.id is not null'
                . ($groupSelector ? " AND login_sessions.group_name IN ($groupSelector)" : '')
                . " AND logins.mode IN ($modeSelector)";

		$testSessionsData = $this->_($sql, [':workspaceId' => $workspaceId],true);

        $sessionChangeMessages = new SessionChangeMessageArray();

		foreach ($testSessionsData as $testSession) {

            $testState = $this->getTestFullState($testSession);

		    $sessionChangeMessage = SessionChangeMessage::session(
                (int) $testSession['test_id'],
                new PersonSession(
                    new LoginSession(
                        (int) $testSession['login_sessions_id'],
                        '',
                        new Login(
                            $testSession['name'],
                            '',
                            $testSession['mode'],
                            $testSession['group_name'],
                            $testSession['group_label'],
                            [],
                            (int) ['workspace_id']
                        )
                    ),
                    new Person(
                        (int) $testSession['person_id'],
                    '',
                        $testSession['code'],
                        (string) $testSession['name_suffix'],
                    )
                ),
                TimeStamp::fromSQLFormat($testSession['test_timestamp_server']),
            );
            $sessionChangeMessage->setTestState(
                $testState,
                $testSession['booklet_name'] ?? ""
            );

            $currentUnitName = $testState['CURRENT_UNIT_ID'] ?? null;

            if ($currentUnitName) {

                $currentUnitState = $this->getUnitState((int) $testSession['test_id'], $currentUnitName);

                if ($currentUnitState) {

                    $sessionChangeMessage->setUnitState($currentUnitName, (array) $currentUnitState);
                }
            }


            $sessionChangeMessages->add($sessionChangeMessage);
        }

		return $sessionChangeMessages;
	}


	private function getUnitState(int $testId, string $unitName): stdClass {

        $unitData = $this->_("select
                laststate
            from
                units
            where
                units.booklet_id = :testId
                and units.name = :unitName",
            [
                ':testId' => $testId,
                ':unitName' => $unitName
            ]
        );

        if (!$unitData) {
            return (object) [];
        }

        $state = JSON::decode($unitData['laststate'], true) ?? (object) [];

        return (object) $state ?? (object) [];
    }


    public function getResponseReportData($workspaceId, $groups): ?array {

        $groupsPlaceholders = implode(',', array_fill(0, count($groups), '?'));
        $bindParams = array_merge([$workspaceId], $groups);

        // TODO: use data class
        $data = $this->_(<<<EOT
            select
                login_sessions.group_name as groupname,
                login_sessions.name as loginname,
                person_sessions.name_suffix as code,
                tests.name as bookletname,
                units.name as unitname,
                units.laststate,
                units.id as unit_id
            from
                login_sessions
                inner join person_sessions on login_sessions.id = person_sessions.login_sessions_id
                inner join tests on person_sessions.id = tests.person_id
                inner join units on tests.id = units.booklet_id
            where
                login_sessions.workspace_id = ?
                and login_sessions.group_name in ($groupsPlaceholders)
                and tests.id is not null

            EOT,
            $bindParams,
            true
        );

        foreach ($data as $index => $row) {
            $data[$index]['responses'] = $this->getResponseDataParts((int) $row['unit_id']);
            unset($data[$index]['unit_id']);
        }

        return $data;

    }


    public function getResponseDataParts(int $unitId): array {
        $data = $this->_(
            'select
                     part_id as id,
                     content,
                     ts,
                     response_type as responseType
                 from
                    unit_data
                 where
                    unit_id = :unit_id',
                [ ':unit_id' => $unitId ],
        true);
        foreach ($data as $index => $row) {
            $data[$index]['ts'] = (int) $row['ts'];
        }
        return $data;
    }


    public function getLogReportData($workspaceId, $groups): ?array {

        $groupsPlaceholders = implode(',', array_fill(0, count($groups), '?'));
        $bindParams = array_merge([$workspaceId], $groups, [$workspaceId], $groups);

        // TODO: use data class
        return $this->_("
            SELECT
				login_sessions.group_name as groupname,
                login_sessions.name as loginname,
                person_sessions.name_suffix as code,
                tests.name as bookletname,
                units.name as unitname,
				unit_logs.timestamp,
                unit_logs.logentry
			FROM
			    login_sessions,
                person_sessions,
                tests,
                units,
                unit_logs
			WHERE
			    login_sessions.workspace_id = ? AND
			    login_sessions.group_name IN ($groupsPlaceholders) AND
			    login_sessions.id = person_sessions.login_sessions_id AND
                person_sessions.id = tests.person_id AND
                tests.id = units.booklet_id AND
                units.id = unit_logs.unit_id
            UNION ALL
            SELECT
				login_sessions.group_name as groupname,
                login_sessions.name as loginname,
                person_sessions.name_suffix as code,
                tests.name as bookletname,
                '' as unitname,
                test_logs.timestamp,
                test_logs.logentry
			FROM
                login_sessions,
                person_sessions,
                tests,
                test_logs
			WHERE
			    login_sessions.workspace_id = ? AND
			    login_sessions.group_name IN ($groupsPlaceholders) AND
			    login_sessions.id = person_sessions.login_sessions_id AND
			    person_sessions.id = tests.person_id AND
			    tests.id = test_logs.booklet_id
			",
            $bindParams,
            true
        );
    }


    public function getReviewReportData($workspaceId, $groups): ?array {

        $groupsPlaceholders = implode(',', array_fill(0, count($groups), '?'));
        $bindParams = array_merge([$workspaceId], $groups, [$workspaceId], $groups);

        // TODO: use data class
        return $this->_("
            SELECT
				login_sessions.group_name as groupname,
                login_sessions.name as loginname,
                person_sessions.name_suffix as code,
                tests.name as bookletname,
                units.name as unitname,
				unit_reviews.priority,
                unit_reviews.categories,
				unit_reviews.reviewtime,
                unit_reviews.entry
			FROM
			    login_sessions,
			    person_sessions,
			    tests,
			    units,
			    unit_reviews
			WHERE
			    login_sessions.workspace_id = ? AND
			    login_sessions.group_name IN ($groupsPlaceholders) AND
			    login_sessions.id = person_sessions.login_sessions_id AND
			    person_sessions.id = tests.person_id AND
			    tests.id = units.booklet_id AND
			    units.id = unit_reviews.unit_id
			UNION ALL
            SELECT
				login_sessions.group_name as groupname,
                login_sessions.name as loginname,
                person_sessions.name_suffix as code,
                tests.name as bookletname,
                '' as unitname,
				test_reviews.priority,
                test_reviews.categories,
				test_reviews.reviewtime,
                test_reviews.entry
			FROM
			    login_sessions,
			    person_sessions,
			    tests,
			    test_reviews
			WHERE
			    login_sessions.workspace_id = ? AND
			    login_sessions.group_name IN ($groupsPlaceholders) AND
			    login_sessions.id = person_sessions.login_sessions_id AND
			    person_sessions.id = tests.person_id AND
			    tests.id = test_reviews.booklet_id
			",
            $bindParams,
            true
        );
    }


    public function getResultStats(int $workspaceId): array {

        // TODO add group label. Problem: when login is gone, label is gone

        $resultStats = $this->_(
            'select group_name,
                       count(*)   as bookletsStarted,
                       min(num_units) as num_units_min,
                       max(num_units) as num_units_max,
                       sum(num_units) as num_units_total,
                       avg(num_units) as num_units_mean,
                       max(timestamp_server) as lastchange
                from (
                         select
                                login_sessions.group_name,
                                count(distinct units.id)    as num_units,
                                max(tests.timestamp_server) as timestamp_server
                         from tests
                                  left join person_sessions on person_sessions.id = tests.person_id
                                  inner join login_sessions on login_sessions.id = person_sessions.login_sessions_id
                                  left join units on units.booklet_id = tests.id
                         where
                               login_sessions.workspace_id = :workspaceId
                               and tests.running = 1
                         group by tests.name, person_sessions.id
                     ) as byGroup
                group by group_name',
            [
                ':workspaceId' => $workspaceId
            ],
            true
        );

        return array_map(function($groupStats) {
            return [
                "groupName" => $groupStats["group_name"],
                "bookletsStarted" => (int) $groupStats["bookletsStarted"],
                "numUnitsMin" => (int) $groupStats["num_units_min"],
                "numUnitsMax" => (int) $groupStats["num_units_max"],
                "numUnitsTotal" => (int) $groupStats["num_units_total"],
                "numUnitsAvg" => (float) $groupStats["num_units_mean"],
                "lastChange" => TimeStamp::fromSQLFormat($groupStats["lastchange"])
            ];
        }, $resultStats);
    }


    public function storeCommand(int $commanderId, int $testId, Command $command): int {

        if ($command->getId() === -1) {
            $maxId = $this->_("select max(id) as max from test_commands");
            $commandId = isset($maxId['max']) ? (int) $maxId['max'] + 1 : 1;
        } else {
            $commandId = $command->getId();
        }

        $this->_("insert into test_commands (id, test_id, keyword, parameter, commander_id, timestamp)
                values (:id, :test_id, :keyword, :parameter, :commander_id, :timestamp)",
                [
                    ':id'           => $commandId,
                    ':test_id'      => $testId,
                    ':keyword'      => $command->getKeyword(),
                    ':parameter'    => json_encode($command->getArguments()),
                    ':commander_id' => $commanderId,
                    ':timestamp'    => TimeStamp::toSQLFormat($command->getTimestamp())
                ]);

        return $commandId;
    }


    // TODO use typed class instead of array
    public function getTest(int $testId): ?array {

        return $this->_(
            'SELECT tests.locked, tests.id, tests.laststate, tests.label FROM tests WHERE tests.id=:id',
            [':id' => $testId]
        );
    }


    public function getGroup(string $groupName): ?Group {

        $group = $this->_(
            'select group_name, group_label
                from logins
                where group_name=:group_name
                group by group_name, group_label',
            [
                ":group_name" => $groupName
            ]
        );
        return ($group == null) ? null : new Group($group['group_name'], $group['group_label']);
    }
}

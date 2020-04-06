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

        $workspacesAsAccessObjects = array_map(function($workspace) {
            return new AccessObject((int) $workspace['id'], $workspace['name']);
        }, $this->getWorkspaces($adminToken));

        $session->setAccessWorkspaceAdmin(...$workspacesAsAccessObjects);

        if ($admin["isSuperadmin"]) {
            $session->setAccessSuperAdmin();
        }

        return $session;
    }


    public function refreshAdminToken(string $token): void {

        $this->_(
            'UPDATE admintokens 
            SET valid_until =:value
            WHERE id =:token',
            [
                ':value' => TimeStamp::expirationFromNow(0, $this->timeUserIsAllowedInMinutes),
                ':token'=> $token
            ]
        );
    }


	public function createAdminToken(string $username, string $password, ?int $validTo = null): string {

		if ((strlen($username) == 0) or (strlen($username) > 50)) {
			throw new Exception("Invalid Username `$username`");
		}

		$passwordSha = $this->encryptPassword($password);

		$user = $this->_getUserByNameAndPasswordHash($username, $passwordSha);

		if ($user === null) {
		    $shortPW = preg_replace('/(^.).*(.$)/m', '$1***$2', $password);
            throw new HttpError("Invalid Password `$shortPW`", 401);
        }

		$this->_deleteTokensByUser((int) $user['id']);

		$token = $this->_randomToken('admin', $username);

		$this->_storeToken((int) $user['id'], $token, $validTo);

		return $token;
	}


	private function _getUserByNameAndPasswordHash(string $userName, string $passwordHash): ?array {

		return $this->_(
			'SELECT * FROM users
			WHERE users.name = :name AND users.password = :password',
			[
				':name' => $userName,
				':password' => $passwordHash
			]
		);
	}


	private function _deleteTokensByUser(int $userId): void {

		$this->_(
			'DELETE FROM admintokens 
			WHERE admintokens.user_id = :id',
			[
				':id' => $userId
			]
		);
	}


	private function _storeToken(int $userId, string $token, ?int $validTo = null): void {

        $validTo = $validTo ?? TimeStamp::expirationFromNow(0, $this->timeUserIsAllowedInMinutes);

		$this->_(
			'INSERT INTO admintokens (id, user_id, valid_until) 
			VALUES(:id, :user_id, :valid_until)',
			[
				':id' => $token,
				':user_id' => $userId,
				':valid_until' => $validTo
			]
		);
	}


	public function logout($token) {

		$this->_(
			'DELETE FROM admintokens 
			WHERE admintokens.id=:token',
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
                admintokens.valid_until as "_validTo",
                admintokens.id as "adminToken"
            FROM users
			INNER JOIN admintokens ON users.id = admintokens.user_id
			WHERE admintokens.id=:token',
			[':token' => $token]
		);

		if (!$tokenInfo) {
            throw new HttpError("Token not valid! ($token)", 403);
        }

        TimeStamp::checkExpiration(0, (int) $tokenInfo['_validTo']);

        $tokenInfo['userEmail'] = $tokenInfo['userEmail'] ?? '';

        return $tokenInfo;
	}


	public function changeBookletLockStatus(int $workspace_id, string $group_name, bool $lock): void { // TODO write unit test

		$lockStr = $lock ? '1' : '0';

		$this->_(
			'UPDATE booklets SET locked=:locked WHERE id IN (
                SELECT inner_select.id from (
                    SELECT booklets.id FROM booklets
                        INNER JOIN persons ON (persons.id = booklets.person_id)
                        INNER JOIN logins ON (persons.login_id = logins.id)
                        INNER JOIN workspaces ON (logins.workspace_id = workspaces.id)
                        WHERE workspaces.id=:workspace_id AND logins.groupname=:groupname
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
			'DELETE FROM logins
			WHERE logins.workspace_id=:workspace_id and logins.groupname = :groupname',
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
				INNER JOIN admintokens ON  users.id = admintokens.user_id
				WHERE admintokens.id =:token',
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
				INNER JOIN admintokens ON  users.id = admintokens.user_id
				WHERE admintokens.id =:token and workspaces.id = :wsId',
			[
				':token' => $token,
				':wsId' => $workspaceId
			]
		);

		return $data != false;
	}


	public function getWorkspaceRole(string $token, int $requestedWorkspaceId): string {

		$user = $this->_(
			'SELECT workspace_users.role FROM workspaces
				INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
				INNER JOIN users ON workspace_users.user_id = users.id
				INNER JOIN admintokens ON  users.id = admintokens.user_id
				WHERE admintokens.id =:token and workspaces.id = :wsId',
			[
				':token' => $token,
				':wsId' => $requestedWorkspaceId
            ]
		);

		return $user['role'] ?? '';
	}


	public function getResultsCount(int $workspaceId): array { // TODO add unit test

		return $this->_(
			'SELECT logins.groupname, logins.name as loginname, persons.code,
				booklets.name as bookletname, COUNT(distinct units.id) AS num_units,
				MAX(units.responses_ts) as lastchange
			FROM booklets
				INNER JOIN persons ON persons.id = booklets.person_id
				INNER JOIN logins ON logins.id = persons.login_id
				INNER JOIN units ON units.booklet_id = booklets.id
			WHERE logins.workspace_id =:workspaceId
			GROUP BY booklets.name, logins.groupname, logins.name, persons.code',
			[
				':workspaceId' => $workspaceId
			],
			true
		);
	}


	public function getBookletsStarted($workspaceId) { // TODO add unit test

		return $this->_(
			'SELECT logins.groupname, logins.name as loginname, persons.code, 
					booklets.name as bookletname, booklets.locked,
					logins.valid_until as lastlogin, persons.valid_until as laststart
				FROM booklets
				INNER JOIN persons ON persons.id = booklets.person_id
				INNER JOIN logins ON logins.id = persons.login_id
				WHERE logins.workspace_id =:workspaceId',
			[
				':workspaceId' => $workspaceId
			],
			true
		);
	}


	public function getBookletsResponsesGiven($workspaceId) { // TODO add unit test

		return $this->_(
			'SELECT DISTINCT booklets.name as bookletname, persons.code, logins.name as loginname,
					logins.groupname FROM units
			INNER JOIN booklets ON booklets.id = units.booklet_id
			INNER JOIN persons ON persons.id = booklets.person_id 
			INNER JOIN logins ON logins.id = persons.login_id
			INNER JOIN workspaces ON workspaces.id = logins.workspace_id
            WHERE workspace_id =:workspaceId			
            ORDER BY logins.groupname, logins.name, persons.code, booklets.name
			',
			[
				':workspaceId' => $workspaceId
			],
			true
		);
	}


	public function getResponses($workspaceId, $groups) { // TODO add unit test

		$groupsString = implode("','", $groups);
		return $this->_(
			"SELECT units.name as unitname, units.responses, units.responsetype, units.laststate, booklets.name as bookletname,
					units.restorepoint_ts, units.responses_ts,
					units.restorepoint, logins.groupname, logins.name as loginname, persons.code
			FROM units
			INNER JOIN booklets ON booklets.id = units.booklet_id
			INNER JOIN persons ON persons.id = booklets.person_id 
			INNER JOIN logins ON logins.id = persons.login_id
			WHERE logins.workspace_id =:workspaceId AND logins.groupname IN ('$groupsString')",
			[
				':workspaceId' => $workspaceId,
			],
			true
		);
	}

	// $return = []; groupname, loginname, code, bookletname, unitname, timestamp, logentry
	public function getLogs($workspaceId, $groups) { // TODO add unit test

		$groupsString = implode("','", $groups);

		$unitData = $this->_(
			"SELECT units.name as unitname, booklets.name as bookletname,
					logins.groupname, logins.name as loginname, persons.code,
					unitlogs.timestamp, unitlogs.logentry
			FROM unitlogs
			INNER JOIN units ON units.id = unitlogs.unit_id
			INNER JOIN booklets ON booklets.id = units.booklet_id
			INNER JOIN persons ON persons.id = booklets.person_id 
			INNER JOIN logins ON logins.id = persons.login_id
			WHERE logins.workspace_id =:workspaceId AND logins.groupname IN ('$groupsString')",
			[
				':workspaceId' => $workspaceId
			],
			true
		);

		$bookletData = $this->_(
			"SELECT booklets.name as bookletname,
					logins.groupname, logins.name as loginname, persons.code,
					bookletlogs.timestamp, bookletlogs.logentry
			FROM bookletlogs
			INNER JOIN booklets ON booklets.id = bookletlogs.booklet_id
			INNER JOIN persons ON persons.id = booklets.person_id 
			INNER JOIN logins ON logins.id = persons.login_id
			WHERE logins.workspace_id =:workspaceId AND logins.groupname IN ('$groupsString')",
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
			"SELECT units.name as unitname, booklets.name as bookletname,
					logins.groupname, logins.name as loginname, persons.code,
					unitreviews.reviewtime, unitreviews.entry,
					unitreviews.priority, unitreviews.categories
			FROM unitreviews
			INNER JOIN units ON units.id = unitreviews.unit_id
			INNER JOIN booklets ON booklets.id = units.booklet_id
			INNER JOIN persons ON persons.id = booklets.person_id 
			INNER JOIN logins ON logins.id = persons.login_id
			WHERE logins.workspace_id =:workspaceId AND logins.groupname IN ('$groupsString')",
			[
				':workspaceId' => $workspaceId
			],
			true
		);

		$bookletData = $this->_(
			"SELECT booklets.name as bookletname,
					logins.groupname, logins.name as loginname, persons.code,
					bookletreviews.reviewtime, bookletreviews.entry,
					bookletreviews.priority, bookletreviews.categories
			FROM bookletreviews
			INNER JOIN booklets ON booklets.id = bookletreviews.booklet_id
			INNER JOIN persons ON persons.id = booklets.person_id 
			INNER JOIN logins ON logins.id = persons.login_id
			WHERE logins.workspace_id =:workspaceId AND logins.groupname IN ('$groupsString')",
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

}

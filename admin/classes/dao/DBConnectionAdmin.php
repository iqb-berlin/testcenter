<?php
/** @noinspection PhpUnhandledExceptionInspection */
// www.IQB.hu-berlin.de
// Bărbulescu, Mechtel
// 2018, 2019
// license: MIT


class DBConnectionAdmin extends DBConnection {


	public function login($username, $password): string {

		if ((strlen($username) == 0) or (strlen($username) > 50)) {
			throw new Exception("Invalid Username `$username`");
		}

		$passwordSha = $this->encryptPassword($password);

		$user = $this->_getUserByNameAndPasswordHash($username, $passwordSha);

		if ($user === null) {
            throw new HttpError("Invalid Password `$password`", 401);
        }

		$this->_deleteTokensByUser($user['id']);

		$token = $this->_createToken();

		$this->_storeToken($user['id'], $token);

		return $token;
	}


	private function _getUserByNameAndPasswordHash(string $userName, string $passwordHash): ?array {

		return $this->_(
			'SELECT * FROM users
			WHERE users.name = :name AND users.password = :password',
			array(
				':name' => $userName,
				':password' => $passwordHash
			)
		);
	}


	private function _deleteTokensByUser(int $userId): void {

		$this->_(
			'DELETE FROM admintokens 
			WHERE admintokens.user_id = :id',
			array(
				':id' => $userId
			)
		);
	}


	private function _createToken(): string {

		return uniqid('a', true);
	}


	private function _storeToken(int $userId, string $token): void {

		$this->_(
			'INSERT INTO admintokens (id, user_id, valid_until) 
			VALUES(:id, :user_id, :valid_until)',
			array(
				':id' => $token,
				':user_id' => $userId,
				':valid_until' => date('Y-m-d H:i:s', time() + $this->idleTime)
			)
		);
	}


	public function logout($token) {

		$this->_(
			'DELETE FROM admintokens 
			WHERE admintokens.id=:token',
			array(':token' => $token)
		);
		// TODO check this functions carefully
		// original description was "deletes all tokens of this user", what is not what this function does
		// check where this is used at all and which behavior exactly was intended
        // then: write unit test
	}


	public function getLoginName(string $token): string {

		$first = $this->_(
			'SELECT users.name FROM users
			INNER JOIN admintokens ON users.id = admintokens.user_id
			WHERE admintokens.id=:token',
			array(':token' => $token)
		);

		$this->refreshAdminToken($token); // TODO separation of concerns
		return $first['name'];
	}


	public function changeBookletLockStatus(int $workspace_id, string $group_name, bool $lock): void { // TODO write unit test

		$lockStr = $lock ? '1' : '0';

		$this->_(
			'UPDATE booklets SET locked=:locked WHERE id IN (
                SELECT booklets.id FROM booklets
                    INNER JOIN persons ON (persons.id = booklets.person_id)
                    INNER JOIN logins ON (persons.login_id = logins.id)
                    INNER JOIN workspaces ON (logins.workspace_id = workspaces.id)
                    WHERE workspaces.id=:workspace_id AND logins.groupname=:groupname
            )',
			array(
				':locked' => $lockStr,
				':workspace_id' => $workspace_id,
				':groupname' => $group_name
            ),
			true
		);
	}


	public function deleteData(int $workspace_id, string $group_name): void { // TODO write unit test // TODO check if this is needed

		$this->_(
			'DELETE FROM logins
			WHERE logins.workspace_id=:workspace_id and logins.groupname = :groupname',
			array(
				':workspace_id' => $workspace_id,
				':groupname' => $group_name
			)
		);
	}


	public function getWorkspaces(string $token): array {

		$data = $this->_(
			'SELECT workspaces.id, workspaces.name, workspace_users.role FROM workspaces
				INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
				INNER JOIN users ON workspace_users.user_id = users.id
				INNER JOIN admintokens ON  users.id = admintokens.user_id
				WHERE admintokens.id =:token',
			array(':token' => $token),
			true
		);

		$this->refreshAdminToken($token); // TODO separation of concerns

		return $data;
	}


	public function hasAdminAccessToWorkspace(string $token, int $workspaceId): bool {

		$data = $this->_(
			'SELECT workspaces.id FROM workspaces
				INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
				INNER JOIN users ON workspace_users.user_id = users.id
				INNER JOIN admintokens ON  users.id = admintokens.user_id
				WHERE admintokens.id =:token and workspaces.id = :wsId',
			array(
				':token' => $token,
				':wsId' => $workspaceId
			)
		);

		return $data != false;
	}


	public function getWorkspaceRole($token, $requestedWorkspaceId) {

		$user = $this->_(
			'SELECT workspace_users.role FROM workspaces
				INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
				INNER JOIN users ON workspace_users.user_id = users.id
				INNER JOIN admintokens ON  users.id = admintokens.user_id
				WHERE admintokens.id =:token and workspaces.id = :wsId',
			array(
				':token' => $token,
				':wsId' => $requestedWorkspaceId
            )
		);

		return $user['role'];
	}


	public function getResultsCount(int $workspaceId): array {

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
			array(
				':workspaceId' => $workspaceId
			),
			true
		);
	}


	public function getBookletsStarted($workspaceId) {

		return $this->_(
			'SELECT logins.groupname, logins.name as loginname, persons.code, 
					booklets.name as bookletname, booklets.locked,
					logins.valid_until as lastlogin, persons.valid_until as laststart
				FROM booklets
				INNER JOIN persons ON persons.id = booklets.person_id
				INNER JOIN logins ON logins.id = persons.login_id
				WHERE logins.workspace_id =:workspaceId',
			array(
				':workspaceId' => $workspaceId
			),
			true
		);
	}


	public function getBookletsResponsesGiven($workspaceId) {

		return $this->_(
			'SELECT DISTINCT booklets.name as bookletname, persons.code, logins.name as loginname,
					logins.groupname FROM units
			INNER JOIN booklets ON booklets.id = units.booklet_id
			INNER JOIN persons ON persons.id = booklets.person_id 
			INNER JOIN logins ON logins.id = persons.login_id
			INNER JOIN workspaces ON workspaces.id = logins.workspace_id
			ORDER BY logins.groupname, logins.name, persons.code, booklets.name
			WHERE workspace_id =:workspaceId',
			array(
				':workspaceId' => $workspaceId
			),
			true
		);
	}


	public function getResponses($workspaceId, $groups) {

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
			array(
				':workspaceId' => $workspaceId,
			),
			true
		);
	}

	// $return = []; groupname, loginname, code, bookletname, unitname, timestamp, logentry
	public function getLogs($workspaceId, $groups) {

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
			array(
				':workspaceId' => $workspaceId
			),
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
			array(
				':workspaceId' => $workspaceId
			),
			true
		);

		foreach ($bookletData as $bd) {
			$bd['unitname'] = '';
			array_push($unitData, $bd);
		}

		return $unitData;
	}

	// $return = []; groupname, loginname, code, bookletname, unitname, priority, categories, entry
	public function getReviews($workspaceId, $groups) {

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
			array(
				':workspaceId' => $workspaceId
			),
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
			array(
				':workspaceId' => $workspaceId
			),
			true
		);

		foreach ($bookletData as $bd) {
			$bd['unitname'] = '';
			array_push($unitData, $bd);
		}

		return $unitData;
	}
}

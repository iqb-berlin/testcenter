<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

require_once('DBConnection.php');

class DBConnectionAdmin extends DBConnection {

	// + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +

	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// deletes all tokens of this user if any and creates new token
	public function login($username, $password) {
		$myreturn = '';

		if (($this->pdoDBhandle != false) and (strlen($username) > 0) and (strlen($username) < 50) 
						and (strlen($password) > 0) and (strlen($password) < 50)) {
			$passwort_sha = $this->encryptPassword($password);
			
			$sql_select = $this->pdoDBhandle->prepare(
				'SELECT * FROM users
					WHERE users.name = :name AND users.password = :password');
				
			if ($sql_select->execute(array(
				':name' => $username, 
				':password' => $passwort_sha))) {

				$selector = $sql_select->fetch(PDO::FETCH_ASSOC);
				if ($selector != false) {
					// first: delete all tokens of this user if any
					$sql_delete = $this->pdoDBhandle->prepare(
						'DELETE FROM admintokens 
							WHERE admintokens.user_id = :id');

					$sql_delete -> execute(array(
						':id' => $selector['id']
					));

					// create new token
					$myreturn = uniqid('a', true);
					
					$sql_insert = $this->pdoDBhandle->prepare(
						'INSERT INTO admintokens (id, user_id, valid_until) 
							VALUES(:id, :user_id, :valid_until)');

					if (!$sql_insert->execute(array(
						':id' => $myreturn,
						':user_id' => $selector['id'],
						':valid_until' => date('Y-m-d H:i:s', time() + $this->idletime)))) {

						$myreturn = '';
					}
				}
			}
		}
		return $myreturn;
	}
	
	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// deletes all tokens of this user
	public function logout($token) {
		if (($this->pdoDBhandle != false) and (strlen($token) > 0)) {
			$sql = $this->pdoDBhandle->prepare(
				'DELETE FROM admintokens 
					WHERE admintokens.id=:token');

			$sql -> execute(array(
				':token'=> $token));
		}
	}

	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// returns the name of the user with given (valid) token
	// returns '' if token not found or not valid
	// refreshes token
	public function getLoginName($token) {
		$myreturn = '';
		if (($this->pdoDBhandle != false) and (strlen($token) > 0)) {
			$sql = $this->pdoDBhandle->prepare(
				'SELECT users.name FROM users
					INNER JOIN admintokens ON users.id = admintokens.user_id
					WHERE admintokens.id=:token');
	
			$sql -> execute(array(
				':token' => $token
			));

			$first = $sql -> fetch(PDO::FETCH_ASSOC);
	
			if ($first != false) {
				$this->refreshAdmintoken($token);
				$myreturn = $first['name'];
			}
		}
		return $myreturn;
	}

	public function changeBookletLockStatus($workspace_id, $group_name, $lock) {
		$myreturn = false;
		if ($this->pdoDBhandle != false) {
			$lockStr = '0';
			if ($lock) {
				$lockStr = '1';
			}
            $sql_update = $this->pdoDBhandle->prepare(
                'UPDATE booklets as b
					INNER JOIN persons ON b.person_id = persons.id
					INNER JOIN logins ON persons.login_id = logins.id
					INNER JOIN workspaces ON logins.workspace_id = workspaces.id
					SET b.locked = :locked
					WHERE workspaces.id=:workspace_id and logins.groupname = :groupname');
            if ($sql_update -> execute(array(
				':workspace_id' => $workspace_id,
				':locked' => $lockStr,
                ':groupname' => $group_name))) {
                $myreturn = true;
            }
		}
		return $myreturn;
	}

	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// returns all workspaces for the user associated with the given token
	// returns [] if token not valid or no workspaces 
	public function getWorkspaces($token) {
		$myreturn = [];
		if (($this->pdoDBhandle != false) and (strlen($token) > 0)) {
			$sql = $this->pdoDBhandle->prepare(
				'SELECT workspaces.id, workspaces.name FROM workspaces
					INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
					INNER JOIN users ON workspace_users.user_id = users.id
					INNER JOIN admintokens ON  users.id = admintokens.user_id
					WHERE admintokens.id =:token');
		
			if ($sql -> execute(array(
				':token' => $token))) {

				$data = $sql->fetchAll(PDO::FETCH_ASSOC);

				if ($data != false) {
					$this->refreshAdmintoken($token);
					$myreturn = $data;
				}
			}
		}
		return $myreturn;
	}

	public function hasAdminAccessToWorkspace($token, $requestedWorkspaceId) {
		$authorized = false;
		$this->refreshAdmintoken($token);
		$sql = $this->pdoDBhandle->prepare(
			'SELECT workspaces.id FROM workspaces
				INNER JOIN workspace_users ON workspaces.id = workspace_users.workspace_id
				INNER JOIN users ON workspace_users.user_id = users.id
				INNER JOIN admintokens ON  users.id = admintokens.user_id
				WHERE admintokens.id =:token and workspaces.id = :wsId');
	
		if ($sql -> execute(array(
			':token' => $token,
			':wsId' => $requestedWorkspaceId))) {

			$data = $sql->fetchAll(PDO::FETCH_ASSOC);
			$authorized = $data != false;
		}
		return $authorized;
	} 

	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// returns the name of the workspace given by id
	// returns '' if not found
	// token is not refreshed
	public function getWorkspaceName($workspace_id) {
		$myreturn = '';
		if ($this->pdoDBhandle != false) {

			$sql = $this->pdoDBhandle->prepare(
				'SELECT workspaces.name FROM workspaces
					WHERE workspaces.id=:workspace_id');
				
			if ($sql -> execute(array(
				':workspace_id' => $workspace_id))) {
					
				$data = $sql -> fetch(PDO::FETCH_ASSOC);
				if ($data != false) {
					$myreturn = $data['name'];
				}
			}
		}
			
		return $myreturn;
	}
  
	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// monitor + results
	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /


	// $return = []; groupname, loginname, code, bookletname, num_units
	public function getResultsCount($workspaceId) {
		$myreturn = [];

		if ($this->pdoDBhandle != false) {
			$sql = $this->pdoDBhandle->prepare(
				'SELECT logins.groupname, logins.name as loginname, persons.code,
						booklets.name as bookletname, COUNT(distinct units.id) AS num_units
					FROM booklets
						INNER JOIN persons ON persons.id = booklets.person_id
						INNER JOIN logins ON logins.id = persons.login_id
						INNER JOIN units ON units.booklet_id = booklets.id
					WHERE logins.workspace_id =:workspaceId
					GROUP BY booklets.name, logins.groupname, logins.name, persons.code');
		
			if ($sql -> execute(array(
				':workspaceId' => $workspaceId))) {

				$data = $sql->fetchAll(PDO::FETCH_ASSOC);
				if ($data != false) {
					$myreturn = $data;
				}
			}
		}
		return $myreturn;
	}

	// $return = []; groupname, loginname, code, bookletname, locked
	public function getBookletsStarted($workspaceId) {
		$myreturn = [];

		if ($this->pdoDBhandle != false) {
			$sql = $this->pdoDBhandle->prepare(
				'SELECT logins.groupname, logins.name as loginname, persons.code, 
						booklets.name as bookletname, booklets.locked
					FROM booklets
					INNER JOIN persons ON persons.id = booklets.person_id
					INNER JOIN logins ON logins.id = persons.login_id
					WHERE logins.workspace_id =:workspaceId');
		
			if ($sql -> execute(array(
				':workspaceId' => $workspaceId))) {

				$data = $sql->fetchAll(PDO::FETCH_ASSOC);
				if ($data != false) {
					$myreturn = $data;
					
					// array_push($return, trim((string) $object["name"]) . "##" . trim((string) $object["code"]) . "##" . trim((string) $object["booklet"]));
				}
			}
		}
		return $myreturn;
	}

	public function getBookletsResponsesGiven($workspaceId) {
		$return = [];  // groupname, loginname, code, bookletname
		if ($this->pdoDBhandle != false) {
			$sql = $this->pdoDBhandle->prepare(
				'SELECT DISTINCT booklets.name as bookletname, persons.code, logins.name as loginname,
						logins.groupname FROM units
				INNER JOIN booklets ON booklets.id = units.booklet_id
				INNER JOIN persons ON persons.id = booklets.person_id 
				INNER JOIN logins ON logins.id = persons.login_id
				INNER JOIN workspaces ON workspaces.id = logins.workspace_id
				ORDER BY logins.groupname, logins.name, persons.code, booklets.name
				WHERE workspace_id =:workspaceId');
		
			if ($sql -> execute(array(
				':workspaceId' => $workspaceId))) {

				$data = $sql->fetchAll(PDO::FETCH_ASSOC);
				if ($data != false) {
					$myreturn = $data;
				}
			}
		}
		return $return;
	}

	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// responses
	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// $return = []; groupname, loginname, code, bookletname, unitname, responses
	public function getResponses($workspaceId) {
		$myreturn = [];
		if ($this->pdoDBhandle != false) {
			$sql = $this->pdoDBhandle->prepare(
				'SELECT units.name as unitname, units.responses, booklets.name as bookletname,
						logins.groupname, logins.name as loginname, persons.code
				FROM units
				INNER JOIN booklets ON booklets.id = units.booklet_id
				INNER JOIN persons ON persons.id = booklets.person_id 
				INNER JOIN logins ON logins.id = persons.login_id
				WHERE logins.workspace_id =:workspaceId');

			if ($sql -> execute(array(
				':workspaceId' => $workspaceId))) {

				$data = $sql->fetchAll(PDO::FETCH_ASSOC);
				if ($data != false) {
					$myreturn = $data;
					// array_push($return, trim((string) $object["name"]) . "##" . trim((string) $object["code"]) . "##" . trim((string) $object["booklet"]));					
				}
			}
		}
		
		return $myreturn;
	}

	// $return = []; groupname, loginname, code, bookletname, unitname, logtime, logentry
	public function getLogs($workspaceId) {
		$myreturn = [];
		if ($this->pdoDBhandle != false) {
			$unit_sql = $this->pdoDBhandle->prepare(
				'SELECT units.name as unitname, booklets.name as bookletname,
						logins.groupname, logins.name as loginname, persons.code,
						unitlogs.logtime, unitlogs.logentry
				FROM unitlogs
				INNER JOIN units ON units.id = unitlogs.unit_id
				INNER JOIN booklets ON booklets.id = units.booklet_id
				INNER JOIN persons ON persons.id = booklets.person_id 
				INNER JOIN logins ON logins.id = persons.login_id
				WHERE logins.workspace_id =:workspaceId');

			if ($unit_sql -> execute(array(
				':workspaceId' => $workspaceId))) {

				$unit_data = $unit_sql->fetchAll(PDO::FETCH_ASSOC);
				if ($unit_data != false) {
					$myreturn = $unit_data;
				}
			}

			$booklet_sql = $this->pdoDBhandle->prepare(
				'SELECT booklets.name as bookletname,
						logins.groupname, logins.name as loginname, persons.code,
						bookletlogs.logtime, bookletlogs.logentry
				FROM bookletlogs
				INNER JOIN booklets ON booklets.id = bookletlogs.booklet_id
				INNER JOIN persons ON persons.id = booklets.person_id 
				INNER JOIN logins ON logins.id = persons.login_id
				WHERE logins.workspace_id =:workspaceId');

			if ($booklet_sql -> execute(array(
				':workspaceId' => $workspaceId))) {

				$booklet_data = $booklet_sql->fetchAll(PDO::FETCH_ASSOC);
				if ($booklet_data != false) {
					foreach($booklet_data as $bd) {
						$bd['unitname'] = '';
						array_push($myreturn, $bd);
					}
				}
			}
		}
		
		return $myreturn;
	}

	// $return = []; groupname, loginname, code, bookletname, unitname, priority, categories, entry
	public function getReviews($workspaceId) {
		$myreturn = [];
		if ($this->pdoDBhandle != false) {
			$unit_sql = $this->pdoDBhandle->prepare(
				'SELECT units.name as unitname, booklets.name as bookletname,
						logins.groupname, logins.name as loginname, persons.code,
						unitreviews.reviewtime, unitreviews.entry,
						unitreviews.priority, unitreviews.categories
				FROM unitreviews
				INNER JOIN units ON units.id = unitreviews.unit_id
				INNER JOIN booklets ON booklets.id = units.booklet_id
				INNER JOIN persons ON persons.id = booklets.person_id 
				INNER JOIN logins ON logins.id = persons.login_id
				WHERE logins.workspace_id =:workspaceId');

			if ($unit_sql -> execute(array(
				':workspaceId' => $workspaceId))) {

				$unit_data = $unit_sql->fetchAll(PDO::FETCH_ASSOC);
				if ($unit_data != false) {
					$myreturn = $unit_data;
				}
			}

			$booklet_sql = $this->pdoDBhandle->prepare(
				'SELECT booklets.name as bookletname,
						logins.groupname, logins.name as loginname, persons.code,
						bookletreviews.reviewtime, bookletreviews.entry,
						bookletreviews.priority, bookletreviews.categories
				FROM bookletreviews
				INNER JOIN booklets ON booklets.id = bookletreviews.booklet_id
				INNER JOIN persons ON persons.id = booklets.person_id 
				INNER JOIN logins ON logins.id = persons.login_id
				WHERE logins.workspace_id =:workspaceId');

			if ($booklet_sql -> execute(array(
				':workspaceId' => $workspaceId))) {

				$booklet_data = $booklet_sql->fetchAll(PDO::FETCH_ASSOC);
				if ($booklet_data != false) {
					foreach($booklet_data as $bd) {
						$bd['unitname'] = '';
						array_push($myreturn, $bd);
					}
				}
			}
		}
		
		return $myreturn;
	}
}


?>
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

<<<<<<< HEAD

	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// returns all booklets stored in the database (i. e. already answered) for the given workspace
	public function getBookletList($workspace_id) {
		$myreturn = [];
		if ($this->pdoDBhandle != false) {

			$sql = $this->pdoDBhandle->prepare(
				'SELECT booklets.name, booklets.laststate, booklets.locked FROM booklets
					INNER JOIN people ON booklets.session_id = people.id
					INNER JOIN logins ON people.login_id = logins.id
					INNER JOIN workspaces ON logins.workspace_id = workspaces.id
					WHERE workspaces.id=:workspace_id');

				
			if ($sql -> execute(array(
				':workspace_id' => $workspace_id))) {
					
					$myreturn = $sql -> fetchAll(PDO::FETCH_ASSOC);
			}
		}
			
		return $myreturn;
	}

=======
>>>>>>> f773d7dfe10b4248f12e498fd70777002fe03c5b
	public function toggleLockedState($workspace_id) {
		$myreturn = [];
		if ($this->pdoDBhandle != false) {

			$sql = $this->pdoDBhandle->prepare(
				'SELECT booklets.locked FROM booklets
<<<<<<< HEAD
					INNER JOIN people ON booklets.session_id = people.id
					INNER JOIN logins ON people.login_id = logins.id
=======
					INNER JOIN persons ON booklets.person_id = persons.id
					INNER JOIN logins ON persons.login_id = logins.id
>>>>>>> f773d7dfe10b4248f12e498fd70777002fe03c5b
					INNER JOIN workspaces ON logins.workspace_id = workspaces.id
					WHERE workspaces.id=:workspace_id');
				
				if ($sql -> execute(array(
				':workspace_id' => $workspace_id))) {
					
					$myreturn = $sql -> fetchAll(PDO::FETCH_ASSOC);
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
	// monitor
	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /



	// $return = []; groupname, loginname, code, bookletname
	public function getBookletsStarted($workspaceId) {
		$return = [];

		if ($this->pdoDBhandle != false) {
			$sql = $this->pdoDBhandle->prepare(
<<<<<<< HEAD
				'SELECT logins.name, people.code, booklets.name as booklet
					FROM booklets
					INNER JOIN people ON people.id = booklets.session_id
					INNER JOIN logins ON logins.id = people.login_id
					INNER JOIN workspaces ON workspaces.id = logins.workspace_id
=======
				'SELECT logins.groupname, logins.name as loginname, persons.code, 
						booklets.name as bookletname
					FROM booklets
					INNER JOIN persons ON persons.id = booklets.person_id
					INNER JOIN logins ON logins.id = persons.login_id
					ORDER BY logins.groupname, logins.name, persons.code, booklets.name
>>>>>>> f773d7dfe10b4248f12e498fd70777002fe03c5b
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
		return $return;
	}

	public function getBookletsResponsesGiven($workspaceId) {
		$return = [];  // groupname, loginname, code, bookletname
		if ($this->pdoDBhandle != false) {
			$sql = $this->pdoDBhandle->prepare(
				'SELECT DISTINCT booklets.name as bookletname, persons.code, logins.name as loginname,
						logins.groupname FROM units
				INNER JOIN booklets ON booklets.id = units.booklet_id
<<<<<<< HEAD
				INNER JOIN people ON people.id = booklets.session_id 
				INNER JOIN logins ON logins.id = people.login_id
=======
				INNER JOIN persons ON persons.id = booklets.person_id 
				INNER JOIN logins ON logins.id = persons.login_id
>>>>>>> f773d7dfe10b4248f12e498fd70777002fe03c5b
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

<<<<<<< HEAD
	public function responsesGiven($workspaceId, $groups) {
		$lines = [];
		$firstLine = ["Group Name", "Login Name", "Code", "Booklet Name", "Unit Name", "Unit Response"];

		array_push($lines, $firstLine);

		if (($this->pdoDBhandle != false) and (strlen($workspaceId) > 0)) {
			foreach ($groups as $group) {
				$sql = $this->pdoDBhandle->prepare(
					'SELECT logins.groupname,logins.name as login_name, people.code, booklets.name AS booklet_name, units.name AS unit_name, units.responses FROM units
						INNER JOIN booklets ON booklets.id = units.booklet_id
						INNER JOIN people ON people.id = booklets.person_id
						INNER JOIN logins ON logins.id = people.login_id
	
						WHERE logins.workspace_id =:workspaceId AND logins.groupname =:groupName');
			
				if ($sql -> execute(array(
					':workspaceId' => $workspaceId,
					 ':groupName' => $group))) {
	
					$dataNewLines = $sql->fetchAll(PDO::FETCH_ASSOC);
					if ($dataNewLines != false) {
						$lines = array_merge($lines, $dataNewLines);	
					}
=======
	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// responses
	// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
	// $return = []; groupname, loginname, code, unitname, responses
	public function getResponses($workspaceId) {
		$return = [];
		if ($this->pdoDBhandle != false) {
			$sql = $this->pdoDBhandle->prepare(
				'SELECT units.name as unitname, units.responses, booklets.name as bookletname,
						logins.groupname, logins.name as loginname, persons.code
				FROM units
				INNER JOIN booklets ON booklets.id = units.booklet_id
				INNER JOIN persons ON persons.id = booklets.person_id 
				INNER JOIN logins ON logins.id = persons.login_id
				ORDER BY logins.groupname, logins.name, persons.code, booklets.name
				WHERE logins.workspace_id =:workspaceId');

			if ($sql -> execute(array(
				':workspaceId' => $workspaceId))) {

				$data = $sql->fetchAll(PDO::FETCH_ASSOC);
				if ($data != false) {
					$return = $data;
					// array_push($return, trim((string) $object["name"]) . "##" . trim((string) $object["code"]) . "##" . trim((string) $object["booklet"]));					
>>>>>>> f773d7dfe10b4248f12e498fd70777002fe03c5b
				}
			}
		}
		
		return $lines;
	}


}

/******************HELPER FUNCTIONS*************/

/* Helpful SQL queries*/

// 1. see name, code, laststate

<<<<<<< HEAD
// SELECT logins.name, people.code, booklets.name
// FROM booklets
// INNER JOIN people ON people.id = booklets.session_id
// INNER JOIN logins ON logins.id = people.login_id
=======
// SELECT logins.name, persons.code, booklets.name
// FROM booklets
// INNER JOIN persons ON persons.id = booklets.person_id
// INNER JOIN logins ON logins.id = persons.login_id
>>>>>>> f773d7dfe10b4248f12e498fd70777002fe03c5b
// INNER JOIN workspaces ON workspaces.id = logins.workspace_id
// WHERE workspace_id =:wsId

	// public function getUniqueIdCSV() {

	// 	if ($this->pdoDBhandle != false) {
	// 		$this->pdoDBhandle->query("UPDATE misc SET value = value+1 WHERE key = 'csvuniqueid'");

	// 		$sql = $this->pdoDBhandle->prepare(
	// 			"SELECT value FROM misc
	// 				WHERE key='csvuniqueid'");
				
	// 		if ($sql -> execute(array())) {
					
	// 			$data = $sql -> fetch(PDO::FETCH_ASSOC);
	// 			if ($data != false) {
			
	// 				$csvuniqueid = intval($data['value']);
	// 				return $csvuniqueid;		
	// 			}
	// 		}
	// 	}
	// 	return -1;

	// }

	/* Hard coded data for testing purposes in ng */
	// public function getReportData($adminToken, $workspaceId, $groups) {
	// 	// check here that the group array is valid and correct
	// 	// use that group array to query the sql for responses and return the result in $list
	// 	$testsWithResponses = $this->responsesGiven($workspaceId);

	// 	$list = array(
	// 		array("name 1", "age 1", "citüüy 1"),
	// 		array("name 2", "age 2", "citäy 2"),
	// 		array("name 3", "age€² 3", "citäöy 3"));
	// 	print_r($testsWithResponses);
	// 	return $testsWithResponses;
		
	// }


?>
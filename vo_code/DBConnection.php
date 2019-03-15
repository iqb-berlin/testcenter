<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

class DBConnection {
    protected $pdoDBhandle = false;
    public $errorMsg = '';
    protected $idletime = 60 * 30;

    // __________________________
    public function __construct() {
        try {
            $cData = json_decode(file_get_contents(__DIR__ . '/DBConnectionData.json'));
            if ($cData->type === 'mysql') {
                $this->pdoDBhandle = new PDO("mysql:host=" . $cData->host . ";port=" . $cData->port . ";dbname=" . $cData->dbname, $cData->user, $cData->password);
            } elseif ($cData->type === 'pgsql') {
                $this->pdoDBhandle = new PDO("pgsql:host=" . $cData->host . ";port=" . $cData->port . ";dbname=" . $cData->dbname . ";user=" . $cData->user . ";password=" . $cData->password);
            }

            $this->pdoDBhandle->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        } catch(PDOException $e) {
            $this->errorMsg = $e->getMessage();
            $this->pdoDBhandle = false;
        }
    }

    // __________________________
    public function __destruct() {
        if ($this->pdoDBhandle !== false) {
            unset($this->pdoDBhandle);
            $this->pdoDBhandle = false;
        }
    }

    // __________________________
    public function isError() {
        return $this->pdoDBhandle == false;
    }

    // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
    // encrypts password to introduce a very private way (salt)
    protected function encryptPassword($password) {
        return sha1('t' . $password);
    }

    // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
    protected function refreshAdmintoken($token) {
        $sql_update = $this->pdoDBhandle->prepare(
            'UPDATE admintokens
                SET valid_until =:value
                WHERE id =:token');

        if ($sql_update != false) {
            $sql_update->execute(array(
                ':value' => date('Y-m-d H:i:s', time() + $this->idletime),
                ':token'=> $token));
        }
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    // returns true if the user with given (valid) token is superadmin
    public function isSuperAdmin($token) {
        $myreturn = false;
        if (($this->pdoDBhandle != false) and (strlen($token) > 0)) {
            $sql = $this->pdoDBhandle->prepare(
                'SELECT users.is_superadmin FROM users
                    INNER JOIN admintokens ON users.id = admintokens.user_id
                    WHERE admintokens.id=:token');
    
            if ($sql != false) {
                if ($sql -> execute(array(
                    ':token' => $token))) {

                    $first = $sql -> fetch(PDO::FETCH_ASSOC);
                    if ($first != false) {
                        $this->refreshAdmintoken($token);
                        $myreturn = ($first['is_superadmin'] == true);
                    }
                }
            }
        }
        return $myreturn;
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
	// returns the id of the workspace given by logintoken
	// returns 0 if not found
	// token is not refreshed
    public function getWorkspaceId($logintoken) {
        $myreturn = 0;

        if (($this->pdoDBhandle != false) and (strlen($logintoken) > 0)) {
			$sql_select = $this->pdoDBhandle->prepare(
				'SELECT logins.workspace_id FROM logins
					WHERE logins.token = :token');
				
			if ($sql_select->execute(array(
				':token' => $logintoken))) {

				$logindata = $sql_select->fetch(PDO::FETCH_ASSOC);
				if ($logindata !== false) {
                    $myreturn = $logindata['workspace_id'];
                }
            }
        }
        return $myreturn;
    }

    // / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /
    public function getBookletName($bookletDbId) {
        $myreturn = '';
        if ($this->pdoDBhandle != false) {
            $booklet_select = $this->pdoDBhandle->prepare(
                'SELECT booklets.name FROM booklets
                    WHERE booklets.id=:bookletId');
                
            if ($booklet_select->execute(array(
                ':bookletId' => $bookletDbId
                ))) {

                $bookletdata = $booklet_select->fetch(PDO::FETCH_ASSOC);
                if ($bookletdata !== false) {
                    $myreturn =  $bookletdata['name'];
                }
            }
        }
        return $myreturn;
    }

}

?>
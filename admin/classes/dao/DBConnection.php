<?php
/** @noinspection PhpUnhandledExceptionInspection */

class DBConnection {

    protected $pdoDBhandle = false;
    protected $idleTime = 60 * 30;
    protected $passwordSalt = 't';

    public function __construct() {

        $configFileName = realpath(__DIR__ . '/../../../config/DBConnectionData.json');
        if (!file_exists($configFileName)) {
            throw new Exception("DB config not found: `$configFileName`");
        }

        $connectionData = JSON::decode(file_get_contents($configFileName));
        if ($connectionData->type === 'mysql') {
            $this->pdoDBhandle = new PDO("mysql:host=" . $connectionData->host . ";port=" . $connectionData->port . ";dbname=" . $connectionData->dbname, $connectionData->user, $connectionData->password);
        } elseif ($connectionData->type === 'pgsql') {
            $this->pdoDBhandle = new PDO("pgsql:host=" . $connectionData->host . ";port=" . $connectionData->port . ";dbname=" . $connectionData->dbname . ";user=" . $connectionData->user . ";password=" . $connectionData->password);
        } else {
            throw new Exception("DB type `{$connectionData->type}` not supoported");
        }

        if (isset($connectionData->salt)) {
            $this->passwordSalt = $connectionData->salt;
        }

        $this->pdoDBhandle->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }


    public function __destruct() {
        if ($this->pdoDBhandle !== false) {
            unset($this->pdoDBhandle);
            $this->pdoDBhandle = false;
        }
    }


    protected function _(string $sql, array $replacements = array(), $multiRow = false): ?array {

        $sqlStatement = $this->pdoDBhandle->prepare($sql);
        $sqlStatement->execute($replacements);

        if (!$sqlStatement->columnCount()) {
            return null;
        }

        if ($multiRow) {
            $result = $sqlStatement->fetchAll(PDO::FETCH_ASSOC);
            return is_bool($result) ? [] : $result;
        }

        $result = $sqlStatement->fetch(PDO::FETCH_ASSOC);
        return is_bool($result) ? null : $result;
    }


    protected function encryptPassword(string $password): string {

        return sha1($this->passwordSalt . $password);
    }


    protected function refreshAdminToken(string $token): void {

        $this->_(
            'UPDATE admintokens 
            SET valid_until =:value
            WHERE id =:token',
            array(
                ':value' => date('Y-m-d H:i:s', time() + $this->idleTime),
                ':token'=> $token
            )
        );
    }


    public function isSuperAdmin(string $token): bool {

        $first = $this->_(
            'SELECT users.is_superadmin 
            FROM users
            INNER JOIN admintokens ON users.id = admintokens.user_id
            WHERE admintokens.id = :token',
            array(':token' => $token)
        );

        $this->refreshAdminToken($token); // TODO separation of concerns

        return ($first['is_superadmin'] == true);
    }


	public function getWorkspaceName($workspace_id) {

        $data = $this->_(
            'SELECT workspaces.name 
            FROM workspaces
            WHERE workspaces.id=:workspace_id',
            array(':workspace_id' => $workspace_id)
        );
			
		return $data['name'];
	}


    public function getWorkspaceId($loginToken) {

        $logindata = $this->_(
            'SELECT logins.workspace_id 
            FROM logins
            WHERE logins.token = :token',
            array(':token' => $loginToken)
        );
        return $logindata['workspace_id'];
    }


    public function getBookletName($bookletDbId) {

        $bookletdata = $this->_(
        'SELECT booklets.name FROM booklets
            WHERE booklets.id=:bookletId',
            array(':bookletId' => $bookletDbId)
        );

        return $bookletdata['name'];
    }

}

?>

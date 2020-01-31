<?php
/** @noinspection PhpUnhandledExceptionInspection */

class DBConnection {

    protected $pdoDBhandle = false;
    protected $idleTime = 60 * 30;
    protected $passwordSalt = 't';

    public function __construct(?DBConfig $connectionData = null) {

        if (!$connectionData) {
            $connectionData = DBConfig::fromFile();
        }

        if ($connectionData->type === 'mysql') {
            $this->pdoDBhandle = new PDO("mysql:host=" . $connectionData->host . ";port=" . $connectionData->port . ";dbname=" . $connectionData->dbname, $connectionData->user, $connectionData->password);
        } elseif ($connectionData->type === 'pgsql') {
            $this->pdoDBhandle = new PDO("pgsql:host=" . $connectionData->host . ";port=" . $connectionData->port . ";dbname=" . $connectionData->dbname . ";user=" . $connectionData->user . ";password=" . $connectionData->password);
        } elseif ($connectionData->type === 'temp') {
            $this->pdoDBhandle = new PDO('sqlite::memory:');
        } else {
            throw new Exception("DB type `{$connectionData->type}` not supported");
        }

        $this->passwordSalt = $connectionData->salt;

        $this->pdoDBhandle->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }


    public function __destruct() {

        if ($this->pdoDBhandle !== false) {
            unset($this->pdoDBhandle);
            $this->pdoDBhandle = false;
        }
    }


    public function _(string $sql, array $replacements = array(), $multiRow = false): ?array {

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


    public function isSuperAdmin(string $token): bool { // TODO move to DBConnectionAdmin or SuperAdmin? // TODO add unit test

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


	public function getWorkspaceName($workspaceId) { // TODO move to DBConnectionAdmin or SuperAdmin? // TODO add unit test

        $data = $this->_(
            'SELECT workspaces.name 
            FROM workspaces
            WHERE workspaces.id=:workspace_id',
            array(':workspace_id' => $workspaceId)
        );
			
		return $data['name'];
	}


    public function getWorkspaceId($loginToken) { // TODO add unit test

        $logindata = $this->_(
            'SELECT logins.workspace_id 
            FROM logins
            WHERE logins.token = :token',
            array(':token' => $loginToken)
        );
        return $logindata['workspace_id'];
    }


    public function getBookletName($bookletDbId) { // TODO add unit test. is used in TC.

        $bookletdata = $this->_(
        'SELECT booklets.name FROM booklets
            WHERE booklets.id=:bookletId',
            array(':bookletId' => $bookletDbId)
        );

        return $bookletdata['name'];
    }


    public function runFile(string $path) {

        if (!file_exists($path)) {
            throw New HttpError("File does not exist: `$path`");
        }

        $this->pdoDBhandle->exec(file_get_contents($path));
    }


    public function getDBType(): string {

        return $this->pdoDBhandle->getAttribute(PDO::ATTR_DRIVER_NAME);
    }

}

?>

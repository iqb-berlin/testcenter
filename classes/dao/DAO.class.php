<?php
/** @noinspection PhpUnhandledExceptionInspection */

class DAO {

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

        date_default_timezone_set('Europe/Berlin'); // TODO store timestamps instead of formatted dates in db
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

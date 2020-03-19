<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class DAO {

    protected $pdoDBhandle = false;
    protected $idleTime = 60 * 30; // TODO move to DBconfig
    protected $passwordSalt = 't';

    public function __construct() {

        $this->pdoDBhandle = DB::getConnection();

        $this->pdoDBhandle->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $this->passwordSalt = DB::getConfig()->salt;

        date_default_timezone_set('Europe/Berlin'); // TODO store timestamps instead of formatted dates in db
    }


    public function __destruct() {

        if ($this->pdoDBhandle !== false) {
            unset($this->pdoDBhandle);
            $this->pdoDBhandle = false;
        }
    }


    public function _(string $sql, array $replacements = [], $multiRow = false): ?array {

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


    protected function _randomToken(string $type) {

        if (DB::getConfig()->staticTokens) {

            return "static_token_$type";
        }

        return uniqid('a', true);
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

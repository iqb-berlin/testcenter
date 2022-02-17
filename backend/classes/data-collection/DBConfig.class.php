<?php
/** @noinspection PhpUnhandledExceptionInspection */

class DBConfig extends DataCollection {

    public ?string $type = "mysql";
    public ?string $host = "localhost";
    public ?string $port = "3306";
    public ?string $dbname = null;
    public ?string $user = null;
    public ?string $password = null;
    public ?string $salt = "t"; // for passwords
    public bool $staticTokens = false; // relevant for unit- and e2e-tests
    public bool $insecurePasswords = false; // relevant for unit- and e2e-tests

    public function __construct($initData, $allowAdditionalInitData = false) {

        if ((isset($initData['type']) and ($initData['type'] == 'temp'))) {

            $this->port = "";
            $this->dbname = "";
            $this->user = "";
            $this->password = "";
            $this->host = "";
        }

        parent::__construct($initData, $allowAdditionalInitData);
    }
}

<?php
/** @noinspection PhpUnhandledExceptionInspection */

class DBConfig extends DataCollection {

    public $type = null;
    public $host = "localhost";
    public $port = null;
    public $dbname = null;
    public $user = null;
    public $password = null;
    public $salt = "t"; // for passwords
    public $staticTokens = false; // relevant for unit- and e2e-tests
    public $insecurePasswords = false; // relevant for unit- and e2e-tests

    public function __construct($initData) {

        if (!isset($initData['port'])) {

            $this->port = (isset($initData['type']) and ($initData['type'] == 'mysql')) ? "3306" : "5432";
        }

        if ((isset($initData['type']) and ($initData['type'] == 'temp'))) {

            $this->port = "";
            $this->dbname = "";
            $this->user = "";
            $this->password = "";
            $this->host = "";
        }

        parent::__construct($initData);
    }
}

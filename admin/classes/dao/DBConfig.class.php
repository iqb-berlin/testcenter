<?php /** @noinspection PhpUnhandledExceptionInspection */

// new DBConnection(DBConfig::fromFile())

class DBConfig {

    public $host = "localhost";
    public $port = "3306";
    public $dbname = "tba";
    public $user = "user";
    public $password = "pw";
    public $salt = "t";
    public $type ="mysql";


    public function __construct($configObject) {

        foreach ($configObject as $param => $value) {
            $this->$param = $value;
        }
    }


    static function fromFile(?string $path = null): DBConfig {

        $configFileName = !$path ? ROOT_DIR . '/config/DBConnectionData.json' : $path;

        if (!file_exists($configFileName)) {
            throw new Exception("DB config file not found: `$configFileName`");
        }

        $connectionData = JSON::decode(file_get_contents($configFileName));

        return new DBConfig($connectionData);
    }

}

<?php
/** @noinspection PhpUnhandledExceptionInspection */

// TODO unit test

class DB {

    /* @var PDO */
    private static $pdo;

    /* @var DBconfig */
    private static $config;

    static function connect(?DBConfig $config = null): void {

        if (!$config) {
            $config = DBConfig::fromFile(ROOT_DIR . '/config/DBConnectionData.json');
        }

        self::$config = $config;

        if ($config->type === 'mysql') {

            self::$pdo = new PDO("mysql:host=" . $config->host . ";port=" . $config->port . ";dbname=" . $config->dbname, $config->user, $config->password);

        } elseif ($config->type === 'pgsql') {

            self::$pdo = new PDO("pgsql:host=" . $config->host . ";port=" . $config->port . ";dbname=" . $config->dbname . ";user=" . $config->user . ";password=" . $config->password);

        } elseif ($config->type === 'temp') {

            self::$pdo = new PDO('sqlite::memory:');

        } else {

            throw new Exception("DB type `{$config->type}` not supported");
        }
    }


    static function getConnection(): PDO {

        if (!self::$pdo) {

            throw new Exception("DB connection not set up yet");
        }

        return self::$pdo;
    }


    static function getConfig(): DBConfig {

        if (!self::$config) {

            throw new Exception("DB connection not set up yet");
        }

        return self::$config;
    }
}

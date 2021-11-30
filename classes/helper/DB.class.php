<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class DB {

    private static PDO $pdo;
    private static DBConfig $config;

    static function connect(?DBConfig $config = null): void {

        self::$config = $config ?? DBConfig::fromFile(ROOT_DIR . '/config/DBConnectionData.json');

        if (self::$config->type === 'mysql') {

            self::$pdo = new PDO(
                "mysql:host=" . self::$config->host . ";port=" . self::$config->port . ";dbname=" . self::$config->dbname,
                self::$config->user,
                self::$config->password
//                [PDO::MYSQL_ATTR_INIT_COMMAND => "SET GLOBAL sql_mode = concat(@@GLOBAL.sql_mode,',PIPES_AS_CONCAT')"] // sqlite compatibility
            );

        } elseif (self::$config->type === 'temp') {

            self::$pdo = new PDO('sqlite::memory:');

        } else {

            throw new Exception("DB type `" . self::$config->type . "` not supported");
        }
    }


    static function getConnection(): PDO {

        if (!isset(self::$pdo)) {

            throw new Exception("DB connection not set up yet");
        }

        return self::$pdo;
    }


    static function getConfig(): DBConfig {

        if (!isset(self::$config)) {

            throw new Exception("DB connection not set up yet");
        }

        return self::$config;
    }
}

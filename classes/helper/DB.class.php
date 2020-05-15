<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
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


    static function connectWithRetries(?DBConfig $config = null, int $retries = 5): void {

        while ($retries--) {

            try {

                error_log("Database Connection attempt");
                DB::connect($config);
                error_log("Database Connection successful");
                return;

            } catch (Throwable $t) {

                error_log("Database Connection failed! Retry: $retries attempts left.");
                usleep(20 * 1000000); // give database container time to come up
            }
        }

        throw new Exception("Database connection failed.");
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

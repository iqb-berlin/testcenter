<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class Password {

    static function encrypt(string $password): string {

        return password_hash($password,  PASSWORD_BCRYPT);
    }

    static function validate(string $password): bool {
    }

    static function verify(string $password, string $hash, string $salt): bool {

        if (strlen($hash) == 40) {

            $legacyHash = sha1($salt . $password);

            if (hash_equals($legacyHash, $hash)) {
                return true;
            }
        }

        return password_verify($password, $hash);
    }
}

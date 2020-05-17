<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class Password {

    static function encrypt(string $password, string $pepper, bool $insecure = false): string {

        // for faster e2e-tests
        if ($insecure === true) {

            return sha1($pepper . $password);
        }

        // dont' use raw output of hash_hmac inside of password_hash
        // https://blog.ircmaxell.com/2015/03/security-issue-combining-bcrypt-with.html
        $hash = password_hash(hash_hmac('sha256', $password, $pepper),  PASSWORD_BCRYPT);

        if (!$hash) {

            // very unlikely in 7.3, but still possible (in future versions):
            // https://stackoverflow.com/questions/39729941/php-password-hash-returns-false/61611426#61611426
            throw new Error("Fatal error when encrypting the password");
        }

        return $hash;
    }


    static function validate(string $password) {

        // NIST SP 800-63 recommends longer passwords, at least 8 characters...
        // to accept the test-account with user123, we take 7 as minimum
        // 60 is maximum to avoid DDOS attacks based on encryption time.

        if ((strlen($password) < 7)) {

            throw new HttpError("Password must have at least 7 characters.", 400);
        }

        if ((strlen($password) > 60)) {

            // don't let attackers know the maximum too easy
            throw new HttpError("Password too long", 400);
        }
    }


    static function verify(string $password, string $hash, string $saltOrPepper): bool {

        if (strlen($hash) == 40) {

            // for legacy passwords. can only be used for timing attack hen actually sha1-password
            // is available, because == comparisons only takes place when legacy passwords present

            $legacyHash = sha1($saltOrPepper . $password);

            if (hash_equals($legacyHash, $hash)) {
                return true;
            }
        }

        return password_verify(hash_hmac('sha256', $password, $saltOrPepper), $hash);
    }
}

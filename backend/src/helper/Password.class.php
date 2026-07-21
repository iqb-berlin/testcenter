<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Password {
  static function encrypt(string $password, string $pepper, bool $insecure = false): string {
    // dont' use raw output of hash_hmac inside of password_hash
    // https://blog.ircmaxell.com/2015/03/security-issue-combining-bcrypt-with.html
    $hash = password_hash(hash_hmac('sha256', $password, $pepper), PASSWORD_BCRYPT, ['cost' => $insecure ? 4 : 10]);

    if (!$hash) {
      // very unlikely in 7.3, but still possible (in future versions):
      // https://stackoverflow.com/questions/39729941/php-password-hash-returns-false/61611426#61611426
      throw new Error("Fatal error when encrypting the password");
    }

    return $hash;
  }

  static function validate(string $password): void {
    $minLength = SystemConfig::$password_min_length;
    $maxLength = 60;
    if ((strlen($password) < $minLength)) {
      throw new HttpError("Password must have at least $minLength characters.", 400);
    }
    if ((strlen($password) > $maxLength)) {
      throw new HttpError("Password too long", 400);
    }

    $pattern = SystemConfig::$password_pattern;
    // preg_match does not seem to work without the extra delimiter (/)
    $check_result = preg_match("/" . $pattern . "/", $password);
    if (!$check_result) {
      throw new HttpError("Password must match regex pattern: `$pattern`", 400);
    }
  }

  static function verify(string $password, string $hash, string $saltOrPepper): bool {
    // for legacy passwords.
    if (strlen($hash) == 40) {
      $legacyHash = sha1($saltOrPepper . $password);

      if (hash_equals($legacyHash, $hash)) {
        return true;
      }
    }

    return password_verify(hash_hmac('sha256', $password, $saltOrPepper), $hash);
  }

  static function shorten(string $password): string {
    return preg_replace('/(^.).*(.$)/m', '$1***$2', $password);
  }
}

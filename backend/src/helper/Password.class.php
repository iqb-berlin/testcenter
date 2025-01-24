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
    // NIST SP 800-63 recommends longer passwords, at least 8 characters...
    // Password policy minimum 10 characters, password should contain a mix of letters (uppercase and lowercase), numbers and symbols.
    // 60 is maximum to avoid DDOS attacks based on encryption time.

    if ((strlen($password) < 10)) {
      throw new HttpError("Password must have at least 10 characters.", 400);
    }

    if ((strlen($password) > 60)) {
      // don't let attackers know the maximum too easy
      throw new HttpError("Password too long", 400);
    }
        
    if (!preg_match('/^(?=.*[\W])(?=.*[A-Z])(?=.*[a-z])(?=.*[\d])/', $password)) {
      throw new HttpError("Password should contain a mix of letters (uppercase and lowercase), numbers and symbols.", 400);
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

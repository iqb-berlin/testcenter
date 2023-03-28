<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Password {
  static function encrypt(string $password, string $pepper, bool $insecure = false): string {
    return $password;
  }

  static function validate(string $password): void {
  }

  static function verify(string $password, string $hash, string $saltOrPepper): bool {
    return $password == $hash;
  }

  static function shorten(string $password): string {
    return preg_replace('/(^.).*(.$)/m', '$1***$2', $password);
  }
}

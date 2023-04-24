<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-test

class Random {
  private const allowedChars = "ABCDEFGHIJKLOMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz0123456789_-";

  static function string(int $size, bool $cryptoSafe): string {
    $fileName = '';
    while ($size-- > 1) {
      $fileName .= substr(self::allowedChars, self::int(0, strlen(self::allowedChars) - 1, $cryptoSafe), 1);
    }
    return $fileName;
  }

  private static function int(int $min, int $max, bool $cryptoSafe): int {
    if (!$cryptoSafe) {
      return rand($min, $max);
    } else {
      return random_int($min, $max);
    }
  }
}



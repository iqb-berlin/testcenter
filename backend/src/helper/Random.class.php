<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit-test

class Random {
  public const charset_default = "abcdefghijklmnopqrstuvwxyz0123456789_-";

  static function string(int $size, bool $cryptoSafe, string $charSet = self::charset_default): string {
    $fileName = '';
    while ($size-- > 0) {
      $fileName .= substr($charSet, self::int(0, strlen($charSet) - 1, $cryptoSafe), 1);
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



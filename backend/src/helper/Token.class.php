<?php

class Token {
  static array $staticTokens = [];
  static function generate(string $type, string $name): string {
    if (DB::getConfig()->staticTokens) {

      if (isset(self::$staticTokens[$name])) {
        self::$staticTokens[$name]++;
      } else {
        self::$staticTokens[$name] = 0;
      }

      $suffix = self::$staticTokens[$name] ? ':' . (self::$staticTokens[$name] + 1) : '';

      return substr("static:$type:$name", 0, 50 - strlen($suffix)) . $suffix;
    }

    return uniqid('a', true);
  }
}
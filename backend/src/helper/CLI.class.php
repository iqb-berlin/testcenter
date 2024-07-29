<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class CLI {
  private const foreground = [
    "Black" => "30",
    "Red" => "31",
    "Green" => "32",
    "Brown" => "33",
    "Blue" => "34",
    "Magenta" => "35",
    "Cyan" => "36",
    "Grey" => "37",
  ];

  private const background = [
    "Black" => "40",
    "Red" => "41",
    "Green" => "42",
    "Yellow" => "43",
    "Blue" => "44",
    "Magenta" => "45",
    "Cyan" => "46",
    "Grey" => "47",
  ];

  static function connectDBWithRetries(int $retries = 5): void {
    while ($retries--) {
      try {
          CLI::p("Database Connection attempt.");
          DB::connect();
          CLI::success("Database Connection successful!");
          return;
      } catch (Throwable) {
        CLI::warning("Database Connection failed! Retry: $retries attempts left.");
        usleep(20 * 1000000); // give database container time to come up
      }
    }

//    CLI::printData(SystemConfig);
    throw new Exception("Database connection failed.");
  }

  // PHP's getopt is bogus: it can not handle empty strings as params properly
  static function getOpt(): array {
    $result = [];
    $params = $GLOBALS['argv'];
    $skipNext = true;

    foreach ($params as $i => $param) {
      if ($skipNext) {
        $skipNext = false;
        continue;
      }

      if ($param[0] == '-') {
        $paramName = substr($param, 1);
        $value = null;

        if ($paramName[0] == '-') { // long-opt (--<param>)
          $paramName = substr($paramName, 1);
          if (str_contains($param, '=')) { // value specified inline (--<param>=<value>)
            list($paramName, $value) = explode('=', substr($param, 2), 2);
          }
        }

        if (!$paramName) {
          $result[] = '--';
          continue;
        }

        if (is_numeric($paramName)) {
          $paramName = '_' . $paramName;
        }

        if (is_null($value)) {
          $nextParam = $params[$i + 1] ?? true;
          $nextIsValue = (is_string($nextParam) and (($nextParam === "") or ($nextParam[0] !== "-")));
          $value = $nextIsValue ? $nextParam : true;
          $skipNext = $nextIsValue;
        }

        $result[$paramName] = $value;

      } else {
        $result[] = $param;
      }
    }
    return $result;
  }

  static function printData(DataCollection $dataCollection): void {
    echo "\n " . get_class($dataCollection);
    foreach ($dataCollection->jsonSerialize() as $key => $value) {
      echo "\n - $key: " . (strstr('password', $key) ? Password::shorten($value) : $value);
    }
  }

  static function p(mixed $text): void {
    echo "\n" . print_r($text, true);
  }

  static function h1(mixed $text): void {
    CLI::printColored(print_r($text, true), "Blue", "Grey", true);
  }

  static function h2(mixed $text): void {
    CLI::printColored(print_r($text, true), "Black", "Grey", true);
  }

  static function h3(mixed $text): void {
    CLI::printColored(print_r($text, true), "Brown", "Grey", true);
  }

  static function h(mixed $text): void {
    CLI::printColored(print_r($text, true), "Grey", "Black", true);
  }

  static function warning(mixed $text): void {
    CLI::printColored(print_r($text, true), "Brown");
  }

  static function error(mixed $text): void {
    CLI::printColored(print_r($text, true), "Red", null, true);
  }

  static function success(mixed $text): void {
    CLI::printColored(print_r($text, true), "Green");
  }

  static private function printColored(mixed $text, string $fg, string $bg = null, bool $bold = false): void {
    $colorString = ($bold ? '1' : '0') . ';' . CLI::foreground[$fg] . ($bg ? ';' . CLI::background[$bg] : '');
    echo "\n\e[{$colorString}m$text\e[0m";
  }
}

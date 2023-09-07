<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit Test

class TimeStamp {
  static public function expirationFromNow(int $validToTimestamp = 0, int $validForMinutes = 0): int {
    $timeZone = new DateTimeZone(SystemConfig::$system_timezone);

    if ($validForMinutes > 0) {
      $validToFromNowOn = new DateTime(self::nowString(), $timeZone);
      $validToFromNowOn->modify("+ $validForMinutes minutes");
    }

    if ($validToTimestamp > 0) {
      $validTo = new DateTime("now", $timeZone);
      $validTo->setTimestamp($validToTimestamp);
    }

    if (isset($validToFromNowOn) and !isset($validTo)) {
      return $validToFromNowOn->getTimestamp();
    }

    if (isset($validTo) and !isset($validToFromNowOn)) {
      return $validTo->getTimestamp();
    }

    if (isset($validToFromNowOn) and isset($validTo)) {
      return min($validTo->getTimestamp(), $validToFromNowOn->getTimestamp());
    }

    return 0;
  }

  static public function checkExpiration(int $validFromTimestamp = 0, int $validToTimestamp = 0): void {
    switch (self::isExpired($validFromTimestamp, $validToTimestamp)->type) {
      case ExpirationStateType::Expired:
        $validTo = self::asDateTime($validToTimestamp);
        throw new HttpError(
          "Testing Period for this login is over since {$validTo->format(SystemConfig::$language_dateFormat)}",
          410
        );
      case ExpirationStateType::Scheduled:
        $validFrom = self::asDateTime($validFromTimestamp);
        throw new HttpError(
          "Testing Period for this login has not yet started and will begin at {$validFrom->format(SystemConfig::$language_dateFormat)}",
          401
        );
    }
  }

  static private function asDateTime(int $timestamp): DateTime {
    $timeZone = new DateTimeZone(SystemConfig::$system_timezone);
    $dateTime = new DateTime("now", $timeZone);
    $dateTime->setTimestamp($timestamp);
    return $dateTime;
  }

  static public function isExpired(int $validFromTimestamp = 0, int $validToTimestamp = 0): ExpirationState {
    $timeZone = new DateTimeZone(SystemConfig::$system_timezone);
    $now = new DateTime(self::nowString(), $timeZone);

    if ($validToTimestamp > 0) {
      $validTo = self::asDateTime($validToTimestamp);
      if ($validTo < $now) {
        return new ExpirationState(ExpirationStateType::Expired, $validToTimestamp);
      }
    }

    if ($validFromTimestamp > 0) {
      $validFrom = self::asDateTime($validFromTimestamp);
      if ($validFrom > $now) {
        return new ExpirationState(ExpirationStateType::Scheduled, $validFromTimestamp);
      }
    }

    return new ExpirationState(ExpirationStateType::None);
  }

  static public function fromSQLFormat(?string $sqlFormatTimestamp): int {
    if (!$sqlFormatTimestamp) {
      return 0;
    }

    $timeZone = new DateTimeZone(SystemConfig::$system_timezone);

    // TODO remove this workaround. problem: date is stored in differently ways in table admintokens and others
    if (is_numeric($sqlFormatTimestamp) and ((int) $sqlFormatTimestamp > 1000000)) {
      $dateTime = new DateTime("now", $timeZone);
      $dateTime->setTimestamp((int) $sqlFormatTimestamp);
      return $dateTime->getTimestamp();
    }

    $dateTime = DateTime::createFromFormat("Y-m-d H:i:s", $sqlFormatTimestamp, $timeZone);
    return $dateTime ? $dateTime->getTimestamp() : 0;
  }

  static public function toSQLFormat(int $timestamp): ?string {
    if ($timestamp <= 0) {
      return null;
    }

    $timeZone = new DateTimeZone(SystemConfig::$system_timezone);
    $dateTime = new DateTime('now', $timeZone);
    $dateTime->setTimestamp($timestamp);
    return $dateTime->format("Y-m-d H:i:s");
  }

  static public function fromXMLFormat(?string $xmlFormatTimestamp): int {
    if (!$xmlFormatTimestamp) {
      return 0;
    }

    $timeZone = new DateTimeZone(SystemConfig::$system_timezone);
    $dateTime = DateTime::createFromFormat("d/m/Y H:i", $xmlFormatTimestamp, $timeZone);
    return $dateTime ? $dateTime->getTimestamp() : 0;
  }

  static public function now(): int {
    $timeZone = new DateTimeZone(SystemConfig::$system_timezone);
    $dateTime = new DateTime(self::nowString(), $timeZone);
    return $dateTime->getTimestamp();
  }

  static private function nowString(): string {
    return (isset(SystemConfig::$debug_useStaticTime) and (SystemConfig::$debug_useStaticTime))
      ? SystemConfig::$debug_useStaticTime
      : 'now';
  }
}

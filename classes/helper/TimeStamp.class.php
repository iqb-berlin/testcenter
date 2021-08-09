<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit Test


class TimeStamp {

    private static $now = 'now';
    private static $timeZone = 'Europe/Berlin';

    static public function setup(?string $timezone = null, ?string $now = null): void {

        self::$timeZone = $timezone ?? 'Europe/Berlin';
        self::$now = $now ?? 'now';
    }

    static public function expirationFromNow(int $validToTimestamp = 0, int $validForMinutes = 0): int {

        $timeZone = new DateTimeZone(self::$timeZone);

        if ($validForMinutes > 0) {

            $validToFromNowOn = new DateTime(self::$now, $timeZone);
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


    static public function checkExpiration(int $validFromTimestamp = 0, int $validToTimestamp = 0) {

        $timeZone = new DateTimeZone(self::$timeZone);
        $format = "d/m/Y H:i";
        $now = new DateTime(self::$now, $timeZone);

        if ($validToTimestamp > 0) {

            $validTo = new DateTime("now", $timeZone);
            $validTo->setTimestamp($validToTimestamp);
            if ($validTo < $now) {
                throw new HttpError(
                    "Testing Period for this login is over since {$validTo->format($format)}",
                    410,
                    "test period expired"
                );
            }
        }

        if ($validFromTimestamp > 0) {

            $validFrom = new DateTime("now", $timeZone);
            $validFrom->setTimestamp($validFromTimestamp);

            if ($validFrom > $now) {
                throw new HttpError(
                    "Testing Period for this login has not yet started and will begin at {$validFrom->format($format)}",
                    401,
                    "test period not started"
                );
            }
        }
    }


    static public function fromSQLFormat(?string $sqlFormatTimestamp): int {

        if (!$sqlFormatTimestamp) {
            return 0;
        }

        $timeZone = new DateTimeZone(self::$timeZone);

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

        $timeZone = new DateTimeZone(self::$timeZone);
        $dateTime = new DateTime('now', $timeZone);
        $dateTime->setTimestamp($timestamp);
        return $dateTime->format("Y-m-d H:i:s");
    }


    static public function fromXMLFormat(?string $xmlFormatTimestamp): int {

        if (!$xmlFormatTimestamp) {
            return 0;
        }

        $timeZone = new DateTimeZone(self::$timeZone);
        $dateTime = DateTime::createFromFormat("d/m/Y H:i", $xmlFormatTimestamp, $timeZone);
        return $dateTime ? $dateTime->getTimestamp() : 0;
    }


    static public function now(): int {

        $timeZone = new DateTimeZone(self::$timeZone);
        $dateTime = new DateTime(self::$now, $timeZone);
        return $dateTime->getTimestamp();
    }
}

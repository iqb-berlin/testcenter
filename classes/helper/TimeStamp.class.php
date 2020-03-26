<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit Test


class TimeStamp {

    static public function expirationFromNow(int $validToTimestamp = 0, int $validForMinutes = 0): int {

        $timeZone = new DateTimeZone('Europe/Berlin');

        if ($validForMinutes > 0) {

            $validToFromNowOn = new DateTime('now', $timeZone);
            $validToFromNowOn->modify("+ $validForMinutes minutes");
        }

        if ($validToTimestamp > 0) {

            $validTo = new DateTime('now', $timeZone);
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

        $timeZone = new DateTimeZone('Europe/Berlin');
        $format = "d/m/Y H:i";
        $now = new DateTime('now', $timeZone);

        if ($validToTimestamp > 0) {

            $validTo = new DateTime('now', $timeZone);
            $validTo->setTimestamp($validToTimestamp);
            if ($validTo < $now) {
                throw new HttpError("Testing Period for this login is over since {$validTo->format($format)}", 401);
            }
        }

        if ($validFromTimestamp > 0) {

            $validFrom = new DateTime('now', $timeZone);
            $validFrom->setTimestamp($validFromTimestamp);

            if ($validFrom > $now) {
                throw new HttpError("Testing Period for this login has not yet started adn will begin at {$validFrom->format($format)}", 401);
            }
        }
    }


    static public function fromSQLFormat(?string $sqlFormatTimestamp): int {

        if (!$sqlFormatTimestamp) {
            return 0;
        }

        $timeZone = new DateTimeZone('Europe/Berlin');
        $dateTime = DateTime::createFromFormat("Y-m-d H:i:s", $sqlFormatTimestamp, $timeZone);
        return $dateTime ? $dateTime->getTimestamp() : 0;
    }


    static public function toSQLFormat(int $timestamp): ?string {

        if ($timestamp <= 0) {
            return null;
        }

        $timeZone = new DateTimeZone('Europe/Berlin');
        $dateTime = new DateTime('now', $timeZone);
        $dateTime->setTimestamp($timestamp);
        return $dateTime->format("Y-m-d H:i:s");
    }


    static public function fromXMLFormat(?string $xmlFormatTimestamp): int {

        if (!$xmlFormatTimestamp) {
            return 0;
        }

        $timeZone = new DateTimeZone('Europe/Berlin');
        $dateTime = DateTime::createFromFormat("d/m/Y H:i", $xmlFormatTimestamp, $timeZone);
        return $dateTime ? $dateTime->getTimestamp() : 0;
    }

}

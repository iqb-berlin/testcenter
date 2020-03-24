<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit Test


class Expiration {


    static public function check(int $validFromTimestamp = 0, int $validToTimestamp = 0) {

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

}

<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class ExternalFile {

    static function download($url): string {

        try {

            return file_get_contents($url);

        } catch (Exception $e) {

            return "";
        }
    }
}

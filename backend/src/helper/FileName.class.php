<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class FileName {

    static function normalize(string $fileName): string {

        return strtoupper($fileName);
    }


    static function hasRecommendedFormat(string $fileName, string $id, string $version, string $extension): bool {

        return strtoupper("$id-$version.$extension") == $fileName;
    }
}

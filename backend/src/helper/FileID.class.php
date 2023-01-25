<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class FileID {

    static function normalize(string $rawId): string {

        $rawIdParts = Version::guessFromFileName($rawId);

        return strtoupper("{$rawIdParts['module']}-{$rawIdParts['major']}.{$rawIdParts['minor']}");
    }
}

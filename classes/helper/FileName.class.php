<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class FileName {

    static function normalize(string $fileName, bool $skipSubVersions): string {

        $normalizedFilename = strtoupper($fileName);

        if ($skipSubVersions) {
            $firstDotPos = strpos($normalizedFilename, '.');
            if ($firstDotPos) {
                $lastDotPos = strrpos($normalizedFilename, '.');
                if ($lastDotPos > $firstDotPos) {
                    $normalizedFilename = substr($normalizedFilename, 0, $firstDotPos) . substr($normalizedFilename, $lastDotPos);
                }
            }
        }

        return $normalizedFilename;
    }

}

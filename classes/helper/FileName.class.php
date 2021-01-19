<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class FileName {

    static function normalize(string $fileName, bool $skipMinorAndPatchVersion): string {

        $normalizedFilename = strtoupper($fileName);

        if (!$skipMinorAndPatchVersion) {

            return $normalizedFilename;
        }

        // TODO use Version::isCompatable instead
        $firstDotPos = strpos($normalizedFilename, '.');
        if ($firstDotPos) {
            $lastDotPos = strrpos($normalizedFilename, '.');
            if ($lastDotPos > $firstDotPos) {
                $normalizedFilename = substr($normalizedFilename, 0, $firstDotPos) . substr($normalizedFilename, $lastDotPos);
            }
        }

        return $normalizedFilename;
    }

}

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

        $firstDotPos = strpos($normalizedFilename, '.');
        if ($firstDotPos) {
            $lastDotPos = strrpos($normalizedFilename, '.');
            if ($lastDotPos > $firstDotPos) {
                $normalizedFilename = substr($normalizedFilename, 0, $firstDotPos) . substr($normalizedFilename, $lastDotPos);
            }
        }

        return $normalizedFilename;
    }


    static function hasRecommendedFormat(string $fileName, string $id, string $version, string $extension): bool {

        return FileName::normalize("$id-$version.$extension", true) == FileName::normalize($fileName, true);
    }
}

<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class FileTime {

    private static ?int $staticModificationTime;

    static public function setup(?int $staticModificationTime): void {

        self::$staticModificationTime = $staticModificationTime;
    }

    static function modification(string $filePath): int {

        if (!file_exists($filePath)) {
            throw new Error("File not found: `$filePath`");
        }
        return self::$staticModificationTime ?? filemtime($filePath);
    }
}

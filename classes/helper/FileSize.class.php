<?php


class FileSize {

    public static $units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    static function asString(int $fileSize): string {
        if ($fileSize == 0) {
            return '-';
        }

        return round($fileSize / pow(1024, ($i = floor(log($fileSize, 1024)))), 2)
            . ' ' . FileSize::$units[$i];
    }
}

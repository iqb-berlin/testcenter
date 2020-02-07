<?php

class FileFactory {

    public static $sizes = array('Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB');

    static function filesizeAsString ( $filesize ) {
        if ($filesize == 0) {
            return '-';
        } else {
            return round($filesize/pow(1024, ($i = floor(log($filesize, 1024)))), 2) . ' ' . FileFactory::$sizes[$i];
        }
    }
}

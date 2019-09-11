<?php

class FileFactory {
    public static $sizes = array('Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB');

    // __________________________
    static function readfolder( $startfolder ) {
        $myreturn = [];
        if (file_exists($startfolder)) {
            $mydir = opendir($startfolder);
            while (($entry = readdir($mydir)) !== false) {
                $fullfilename = $startfolder . $entry;
                if (is_file($fullfilename)) {
                    $rs = new ResourceFile($entry, filemtime($fullfilename), filesize($fullfilename));
                    array_push($myreturn, $rs);
                }
            }
        } else {
            echo '##';
        }
        return $myreturn;
    }

    // __________________________
    static function filesizeAsString ( $filesize ) {
        if ($filesize == 0) {
            return '-';
        } else {
            return round($filesize/pow(1024, ($i = floor(log($filesize, 1024)))), 2) . ' ' . FileFactory::$sizes[$i];
        }
    }
}

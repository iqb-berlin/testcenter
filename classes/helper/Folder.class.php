<?php

// TODO unit test

class Folder {

    // stream save (PHP's function glob is not)
    static function glob(string $dir, string $filePattern = null): array {

        $files = scandir($dir);
        $found = [];

        foreach ($files as $filename) {

            if (in_array($filename, ['.', '..'])) {
                continue;
            }

            if (!$filePattern or fnmatch($filePattern, $filename)) {
                $found[] = "{$dir}/{$filename}";
            }
        }

        return $found;
    }
}

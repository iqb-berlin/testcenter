<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
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


    static function getContentsRecursive(string $path): array {

        $list = [];

        if ($handle = opendir($path)) {
            while (false !== ($entry = readdir($handle))) {
                if ($entry != "." && $entry != "..") {
                    if (is_file("$path/$entry")) {
                        $list[] = $entry;
                    }
                    if (is_dir("$path/$entry")) {
                        $list[$entry] = Folder::getContentsRecursive("$path/$entry");
                    }
                }
            }
            closedir($handle);
        }

        return $list;
    }

    // TODO unit-test
    static function deleteContentsRecursive(string $path): void {

        foreach(new DirectoryIterator($path) as $entry) {

            if ($entry->isDot()) continue; // skip . and ..

            if ($entry->isFile()) {

                unlink($entry->getPathname());

            } else if ($entry->isDir()) {

                Folder::deleteContentsRecursive($entry->getPathname());
            }
        }
    }

}

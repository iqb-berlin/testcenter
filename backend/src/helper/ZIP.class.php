<?php

class ZIP {

    static function extract(string $zipPath, string $extractionPath): void {

        $zip = new ZipArchive;
        if ($zip->open($zipPath) !== true) {
            throw new Exception('Could not extract archive');
        }
        $zip->extractTo($extractionPath . '/');
        $zip->close();
    }

    static function readFile(string $zipPath, string $filePath): string {

        $zip = new ZipArchive;
        if ($zip->open($zipPath) !== true) {
            throw new Exception('Could not open Zip-File');
        }

        $fileContent = $zip->getFromName($filePath);
        if (!$fileContent) {
            $zip->close();
            throw new Exception("File `$filePath` not found in archive");
        }

        $zip->close();

        return $fileContent;
    }


    static function forEachFile(string $zipPath, callable $callback): void {

        $zip = new ZipArchive;
        if ($zip->open($zipPath) !== true) {
            throw new Exception('Could not open Zip-File');
        }

        $error = null;

        for ($i = 0; $i < $zip->numFiles; $i++) {

            try {

                $fileName = $zip->getNameIndex($i);

                $isDir = (substr($fileName, -1, 1) == '/');

                if (!$isDir) {

                    $callback($fileName, $zip->getStream($fileName));
                }

            } catch (Exception $e) {

                $error = "Problem processing `$fileName`: " . $e->getMessage();
            }
        }

        $zip->close();

        if ($error) {
            throw new Exception($error);
        }
    }
}

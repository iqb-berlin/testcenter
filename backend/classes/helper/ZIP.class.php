<?php

class ZIP {

    static function extract(string $filePath, string $extractionPath): void {

        $zip = new ZipArchive;
        if ($zip->open($filePath) !== true) {
            throw new Exception('Could not extract Zip-File');
        }
        $zip->extractTo($extractionPath . '/');
        $zip->close();
    }
}

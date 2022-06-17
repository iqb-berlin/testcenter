<?php

class ZIP {

    static function extract(string $zipPath, string $extractionPath): void {

        $zip = new ZipArchive;
        if ($zip->open($zipPath) !== true) {
            throw new Exception('Could not extract archive');
        }
        $zip->extractTo($extractionPath . '/');
        $zip->close(); // TODO wrap inside finally block
    }

    static function readMeta(string $zipPath): array {

        $zip = new ZipArchive;
        if ($zip->open($zipPath) !== true) {
            throw new Exception('Could not extract archive');
        }

        try {

            return [
                "comment" =>  $zip->getArchiveComment(ZipArchive::FL_UNCHANGED),
                "count" => $zip->numFiles,
            ];

        } catch (Exception $exception) {

            $zip->close();
            throw $exception;
        }
    }
}

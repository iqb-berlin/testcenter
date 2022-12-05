<?php

class ZIP {

    static function extract(string $zipPath, string $extractionPath): void {

        $zip = new ZipArchive;
        if ($errorCode = $zip->open($zipPath) !== true) {
            throw new Exception('Could not extract archive:' . ZIP::getErrorMessageText($errorCode));
        }
        $zip->extractTo($extractionPath . '/');
        $zip->close(); // TODO wrap inside finally block
    }

    static function readMeta(string $zipPath): array {

        $zip = new ZipArchive;
        // ZIP can not be extracted in VFS-mode (api-tests), but with ZipArchive::CREATE an empty ZIP gets created instead
        if ($errorCode = $zip->open($zipPath, ZipArchive::CREATE) !== true) {
            throw new Exception('Could not read archive:' . ZIP::getErrorMessageText($errorCode));
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


    static function create(string $fileName): ZipArchive {

        $zip = new ZipArchive;
        $res = $zip->open($fileName, ZipArchive::CREATE);
        if ($res === TRUE) {
            return $zip;
        }
        $error = ZIP::getErrorMessageText($res);
        throw new Exception("Could not create ZIP: `$error`");
    }


    static private function getErrorMessageText(int $errorCode): string {

        return match ($errorCode) {
            ZipArchive::ER_EXISTS => "File already exists",
            ZipArchive::ER_INCONS => "Zip archive inconsistent.",
            ZipArchive::ER_INVAL => "Invalid argument.",
            ZipArchive::ER_MEMORY => "Malloc failure.",
            ZipArchive::ER_NOENT => "No such file.",
            ZipArchive::ER_NOZIP => "Not a zip archive.",
            ZipArchive::ER_OPEN => "Can't open file.",
            ZipArchive::ER_READ => "Read error.",
            ZipArchive::ER_SEEK => "Seek error.",
            ZipArchive::ER_MULTIDISK => "Multi-disk zip archives not supported.",
            ZipArchive::ER_CLOSE => "Closing zip archive failed.",
            ZipArchive::ER_RENAME => "Renaming temporary file failed.",
            ZipArchive::ER_WRITE => "Write error.",
            ZipArchive::ER_CRC => "CRC error.",
            ZipArchive::ER_ZIPCLOSED => "Containing zip archive was closed.",
            ZipArchive::ER_TMPOPEN => "Failure to create temporary file.",
            ZipArchive::ER_ZLIB => "Zlib error.",
            ZipArchive::ER_CHANGED => "Entry has been changed.",
            ZipArchive::ER_COMPNOTSUPP => "Compression method not supported.",
            ZipArchive::ER_EOF => "Premature EOF.",
            ZipArchive::ER_INTERNAL => "Internal error.",
            ZipArchive::ER_REMOVE => "Can't remove file.",
            ZipArchive::ER_DELETED => "Entry has been deleted.",
            default => "Unknown error: $errorCode",
        };
    }
}

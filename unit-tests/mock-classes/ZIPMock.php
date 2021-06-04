<?php

// Zip-Archive import can not be tested, because
// ext/zip does not support userland stream wrappers - so no vfs-support
// see https://github.com/bovigo/vfsStream/wiki/Known-Issues
// Therefore we use this Mock-Class.

class ZIP {

    static array $mockArchive = [];

    static function extract(string $filePath, string $extractionPath): void {

        foreach (self::$mockArchive as $name => $content) {

            file_put_contents("$extractionPath/$name", $content);
        }
    }
}

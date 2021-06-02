<?php

class ZIP {

    static array $mockArchive = [];

    static function extract(string $filePath, string $extractionPath): void {

        foreach (self::$mockArchive as $name => $content) {

            file_put_contents("$extractionPath/$name", $content);
        }
    }
}

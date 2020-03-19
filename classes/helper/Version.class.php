<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class Version {

    static function get(): string {

        $composerFile = file_get_contents(ROOT_DIR . '/composer.json');
        $composerData = JSON::decode($composerFile);
        return $composerData->version;
    }
}

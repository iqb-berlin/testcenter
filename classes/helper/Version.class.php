<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class Version {

    static function get(): string {

        $composerFile = file_get_contents(ROOT_DIR . '/composer.json');
        $composerData = JSON::decode($composerFile);
        return $composerData->version;
    }


    static function isCompatible(string $subject, ?string $object = null): bool {

        if (!$object) {
            $object = Version::get();
        }

        $objectVersionParts = explode('.', $object);
        $subjectVersionParts = explode('.', $subject);

        $objectMayor = (int) $objectVersionParts[0];
        $subjectMayor = (int) $subjectVersionParts[0];
        $objectMinor = isset($objectVersionParts[1]) ? (int) $objectVersionParts[1] : 0;
        $subjectMinor = isset($subjectVersionParts[1]) ? (int) $subjectVersionParts[1] : 0;

        if ($objectMayor != $subjectMayor) {

            return false;
        }

        return ($objectMinor >= $subjectMinor);
    }
}

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

        $object = Version::split($object);
        $subject = Version::split($subject);

        if ($object['major'] != $subject['major']) {

            return false;
        }

        return ($object['minor'] >= $subject['minor']);
    }


    private static function split(string $object): array {

        $objectVersionParts = preg_split("/[.-]/", $object);

        return [
            'major' => (int) $objectVersionParts[0],
            'minor' => isset($objectVersionParts[1]) ? (int) $objectVersionParts[1] : 0,
            'patch' => isset($objectVersionParts[2]) ? (int) $objectVersionParts[2] : 0,
            'label' => $objectVersionParts[3] ?? ""
        ];
    }


    static function compare(string $subject, ?string $object = null): int {

        if (!$object) {
            $object = Version::get();
        }

        $object = Version::split($object);
        $subject = Version::split($subject);

        if ($subject['major'] > $object['major']) {
            return 1;
        }

        if ($subject['major'] < $object['major']) {
            return -1;
        }

        if ($subject['minor'] > $object['minor']) {
            return 1;
        }

        if ($subject['minor'] < $object['minor']) {
            return -1;
        }

        if ($subject['patch'] > $object['patch']) {
            return 1;
        }

        if ($subject['patch'] < $object['patch']) {
            return -1;
        }

        if (strcasecmp($subject['label'], $object['label']) > 0) {
            return 1;
        }

        if (strcasecmp($subject['label'], $object['label']) < 0) {
            return -1;
        }

        return 0;
    }
}

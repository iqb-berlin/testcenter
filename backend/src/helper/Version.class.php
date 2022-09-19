<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class Version {

    static function get(): string {

        $composerFile = file_get_contents(ROOT_DIR . '/package.json');
        $composerData = JSON::decode($composerFile);
        return $composerData->version;
    }


    static function getAll(): array {

        $composerFile = file_get_contents(ROOT_DIR . '/package.json');
        $composerData = JSON::decode($composerFile);
        $v = "verona-player-api-versions";
        return [
            'version' => $composerData->version,
            'veronaMax' => $composerData->iqb->$v->max,
            'veronaMin' => $composerData->iqb->$v->min
        ];
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


    static function guessFromFileName(string $fileName): array {
        // this regex includes some naming habits from verona 2 to 4 times
        $regex = "/^(\D+?)[@V-]?((\d+)(\.\d+)?(\.\d+)?(-\S+?)?).\D{3,4}$/";
        $matches = [];
        preg_match($regex, $fileName, $matches);
        return [
            'full' => $matches[2] ?? '',
            'major' => (int) ($matches[3] ?? '0'),
            'minor' => isset($matches[4]) ? ((int) substr($matches[4], 1)) : 0,
            'patch' => isset($matches[5]) ? ((int) substr($matches[5], 1)) : 0,
            'label' => isset($matches[6]) ? substr($matches[6], 1) : '',
        ];
    }


    static function split(string $object): array {

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

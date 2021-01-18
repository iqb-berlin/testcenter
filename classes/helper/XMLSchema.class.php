<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class XMLSchema {

    private static bool $allowExternalXMLSchema = true;

    static function setup(bool $allowExternalXMLSchema): void {

        self::$allowExternalXMLSchema = $allowExternalXMLSchema;
    }

    // TODO use defined class instead of plain array
    static function parseSchemaUrl(string $schemaUrl, bool $detectFilePath = false): ?array {

        $regex = '#^(http)?.*?((\d+).(\d+).(\d+))?\/?definitions\/v?o?_?(\S*).xsd$#';
        preg_match_all($regex, $schemaUrl, $matches, PREG_SET_ORDER, 0);

        if (!count($matches)) {
            return null;
        }
        $urlParts = $matches[0]; // TODO handle multiple schemas

        $schemaData = [
            "isUrl"         => ($urlParts[1] === 'http') && isset($urlParts[2]),
            "version"       => isset($urlParts[2]) ? $urlParts[2] : '',
            "mayor"         => isset($urlParts[3]) ? (int) $urlParts[3] : 0,
            "minor"         => isset($urlParts[4]) ? (int) $urlParts[4] : 0,
            "patch"         => isset($urlParts[5]) ? (int) $urlParts[5] : 0,
            "type"          => isset($urlParts[6]) ? $urlParts[6] : 'unknown',
            "url"           => $schemaUrl,
            "filePath"      => false
        ];

        if ($detectFilePath) {
            $schemaData["filePath"] = XMLSchema::getSchemaFilePath($schemaData);
        }

        return $schemaData;
    }


    static function getLocalSchema(string $type): array {

        if (!file_exists(ROOT_DIR . "/definitions/vo_$type.xsd")) {

            throw new Exception("Unknown XML type: `$type`");
        }

        $version = Version::get();
        $versionParts = explode('.', $version);

        return [
            "isUrl"         => false,
            "version"       => $version,
            "mayor"         => isset($versionParts[0]) ? (int) $versionParts[0] : 0,
            "minor"         => isset($versionParts[1]) ? (int) $versionParts[1] : 0,
            "patch"         => isset($versionParts[2]) ? (int) $versionParts[2] : 0,
            "type"          => $type,
            "url"           => false,
            "filePath"      => ROOT_DIR . "/definitions/vo_$type.xsd"
        ];
    }


    private static function getSchemaFilePath(array $schemaData): string {

        if (!$schemaData) {
            return '';
        }

        if (!self::$allowExternalXMLSchema or !$schemaData['isUrl']) {
            return XMLSchema::accessDefinitionsDir($schemaData);
        } else {
            return XMLSchema::accessSchemaCache($schemaData);
        }
    }


    private static function accessDefinitionsDir($schemaData): string {

        $filePath = ROOT_DIR . "/definitions/vo_{$schemaData['type']}.xsd";

        if (file_exists($filePath)) {
            return $filePath;
        }

        return "";
    }


    private static function accessSchemaCache(array $schemaData): string {

        if (!$schemaData['isUrl']) {
            return '';
        }

        $folder = DATA_DIR . "/.schemas/{$schemaData['type']}/v{$schemaData['mayor']}/";
        $fileName = "{$schemaData['type']}-{$schemaData['version']}.xsd";

        if (file_exists("$folder$fileName")) {

            if (!filesize("$folder$fileName")) {

                return "";
            }

            return "$folder$fileName";
        }

        Folder::createPath($folder);

        if (!is_writable($folder)) {

            throw new Exception("`$folder` is not writeable!");
        }

        try {

            $fileContent = file_get_contents($schemaData['url']);

        } catch (Exception $e) {

            $fileContent = "";
        }

        file_put_contents("$folder$fileName", $fileContent);

        return $fileContent ? "$folder$fileName" : '';
    }
}

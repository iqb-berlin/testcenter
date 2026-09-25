<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class XMLSchema {
  // TODO use defined class instead of plain array

  static function parseSchemaUrl(string $schemaUri): ?array {
    if (empty($schemaUri)) {
      return null;
    }

    $regex = '#^https?://w3id\.org/iqb/spec/([a-z-]+-xml)/(([0-9]+)\.[0-9]+)$#';
    preg_match_all($regex, $schemaUri, $matches, PREG_SET_ORDER);

    if (!count($matches)) {
      return null;
    }

    $urlParts = $matches[0];
    $repo = $urlParts[1];

    $type = null;
    foreach (SystemConfig::$system_xmlSchemaVersions as $fileType => $schema) {
      if ($schema['repo'] === $repo) {
        $type = $fileType;
      }
    }

    if (!$type) {
      return null;
    }

    return [
      "isExternal" => true,
      "repo"       => $repo,
      "type"       => $type,
      "version"    => $urlParts[2],
      "major"      => (int) $urlParts[3],
      "uri"        => $schemaUri
    ];
  }

 static function getSchemaFilePath(?array $schemaData): ?string {
    if (!$schemaData) {
      return null;
    }

    return XMLSchema::accessSchemaCache($schemaData);
  }

  private static function accessSchemaCache(array $schemaData): ?string {
    $folder = DATA_DIR . "/.schemas/{$schemaData['repo']}/{$schemaData['version']}/";
    $fileName = "{$schemaData['repo']}.xsd";

    if (file_exists("$folder$fileName")) {
      return "$folder$fileName";
    }

    $fileContent = ExternalFile::download($schemaData['uri']);

    if (!$fileContent) {
      return null;
    }

    Folder::createPath($folder);

    if (!is_writable($folder)) {
      throw new Exception("`$folder` is not writeable!");
    }

    file_put_contents("$folder$fileName", $fileContent);

    return "$folder$fileName";
  }
}

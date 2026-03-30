<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class XMLSchema {
  // TODO use defined class instead of plain array

  static function parseSchemaUrl(string $schemaUri): ?array {
    if (empty($schemaUri)) {
      return null;
    }

    $regex = '#^https?://w3id\.org/iqb/spec/(testcenter-booklet|unit|testcenter-testtaker|testcenter-syscheck)-xml/([0-9]+\.[0-9]+)$#';
    preg_match_all($regex, $schemaUri, $matches, PREG_SET_ORDER);

    if (!count($matches)) {
      return null;
    }

    $urlParts = $matches[0];
    $repo = $urlParts[1] . '-xml';

    $typeMap = [
      'testcenter-booklet'    => 'Booklet',
      'unit'                  => 'Unit',
      'testcenter-testtaker'  => 'Testtakers',
      'testcenter-syscheck'   => 'SysCheck'
    ];

    $type = $typeMap[$urlParts[1]];

    $schemaData = [
      "isExternal" => true,
      "repo"       => $repo,
      "type"       => $type,
      "version"    => $urlParts[2],
      "uri"        => $schemaUri
    ];

    return $schemaData;
  }

 static function getSchemaFilePath(?array $schemaData): ?string {
    if (!$schemaData) {
      return null;
    }

    return XMLSchema::accessSchemaCache($schemaData);
  }

  private static function accessSchemaCache(array $schemaData): string {
    if (!$schemaData['isExternal']) {
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

    $fileContent = ExternalFile::download($schemaData['uri']);

    file_put_contents("$folder$fileName", $fileContent);

    return $fileContent ? "$folder$fileName" : '';
  }
}

<?php

class ExternalFile {
  static function download($url): string {
    $parts = XMLSchema::parseSchemaUrl($url);

    if (!$parts) {
      return "";
    }

    $fixturePath = ROOT_DIR . "/backend/test/unit/testdata/schemas/{$parts['repo']}.xsd";

    if (file_exists($fixturePath)) {
      return file_get_contents($fixturePath);
    }

    return "";
  }
}
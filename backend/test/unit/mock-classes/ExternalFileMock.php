<?php

class ExternalFile {
  static function download($url): string {
    $parts = XMLSchema::parseSchemaUrl($url);

    if ($parts['type'] and (($parts['version'] === '5.0.1') or (($parts['mayor'] >= 7) and ($parts['mayor'] < 500)))) {
      return file_get_contents(REAL_ROOT_DIR . "/definitions/vo_{$parts['type']}.xsd");
    } else {
      return "";
    }
  }
}

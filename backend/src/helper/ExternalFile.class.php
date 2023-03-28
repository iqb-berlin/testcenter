<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class ExternalFile {
  static function download($url): string {
    try {
      $content = file_get_contents($url);
      return $content ? $content : "";

    } catch (Exception $e) {
      return "";
    }
  }
}

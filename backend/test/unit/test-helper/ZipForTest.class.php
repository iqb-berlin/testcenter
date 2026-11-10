<?php
declare(strict_types=1);

class ZipForTest {
  /**
   * Builds a real ZIP archive. ZipArchive cannot write to vfs, so it is built in a temp file.
   *
   * @param array<string, string|array> $archive file name => content, or folder name => nested array
   */
  static function createContent(array $archive, string $comment = ''): string {
    $zipPath = tempnam(sys_get_temp_dir(), 'zip-for-test-');
    try {
      $zip = new ZipArchive();
      $zip->open($zipPath, ZipArchive::OVERWRITE);
      self::addEntries($zip, $archive, '');
      $zip->setArchiveComment($comment);
      $zip->close();
      return file_get_contents($zipPath);
    } finally {
      unlink($zipPath);
    }
  }

  private static function addEntries(ZipArchive $zip, array $entries, string $folder): void {
    foreach ($entries as $name => $content) {
      if (is_array($content)) {
        self::addEntries($zip, $content, "$folder$name/");
      } else {
        $zip->addFromString("$folder$name", $content);
      }
    }
  }
}

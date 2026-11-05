<?php
/** @noinspection PhpUnhandledExceptionInspection */

// ZipArchive only opens local files, so archives given as content are written to a temp file first.
class ZIP {
  static function extract(string $zipContent, string $extractionPath): void {
    self::useTempFile($zipContent, function(string $zipPath) use ($extractionPath): void {
      $zip = self::open($zipPath, 'extract');
      try {
        if (!$zip->extractTo($extractionPath . '/')) {
          throw new Exception('Could not extract archive.');
        }
      } finally {
        $zip->close();
      }
    });
  }

  static function readMeta(string $zipContent): array {
    return self::useTempFile($zipContent, function(string $zipPath): array {
      $zip = self::open($zipPath, 'read');
      try {
        return [
          "comment" => $zip->getArchiveComment(ZipArchive::FL_UNCHANGED),
          "count" => $zip->numFiles,
        ];
      } finally {
        $zip->close();
      }
    });
  }

  private static function open(string $zipPath, string $purpose): ZipArchive {
    $zip = new ZipArchive;
    $result = $zip->open($zipPath);
    if ($result !== true) {
      throw new Exception("Could not $purpose archive: " . ZIP::getErrorMessageText($result));
    }
    return $zip;
  }

  private static function useTempFile(string $content, Closure $use): mixed {
    $tempPath = tempnam(sys_get_temp_dir(), 'zip-');
    try {
      if (file_put_contents($tempPath, $content) === false) {
        throw new Exception("Could not write temp file `$tempPath`.");
      }
      return $use($tempPath);
    } finally {
      unlink($tempPath);
    }
  }

  static function create(string $fileName): ZipArchive {
    $zip = new ZipArchive;
    $res = $zip->open($fileName, ZipArchive::CREATE);
    if ($res === true) {
      return $zip;
    }
    $error = ZIP::getErrorMessageText($res);
    throw new Exception("Could not create ZIP: `$error`");
  }

  static private function getErrorMessageText(int $errorCode): string {
    return match ($errorCode) {
      ZipArchive::ER_EXISTS => "File already exists",
      ZipArchive::ER_INCONS => "Zip archive inconsistent.",
      ZipArchive::ER_INVAL => "Invalid argument.",
      ZipArchive::ER_MEMORY => "Malloc failure.",
      ZipArchive::ER_NOENT => "No such file.",
      ZipArchive::ER_NOZIP => "Not a zip archive.",
      ZipArchive::ER_OPEN => "Can't open file.",
      ZipArchive::ER_READ => "Read error.",
      ZipArchive::ER_SEEK => "Seek error.",
      ZipArchive::ER_MULTIDISK => "Multi-disk zip archives not supported.",
      ZipArchive::ER_CLOSE => "Closing zip archive failed.",
      ZipArchive::ER_RENAME => "Renaming temporary file failed.",
      ZipArchive::ER_WRITE => "Write error.",
      ZipArchive::ER_CRC => "CRC error.",
      ZipArchive::ER_ZIPCLOSED => "Containing zip archive was closed.",
      ZipArchive::ER_TMPOPEN => "Failure to create temporary file.",
      ZipArchive::ER_ZLIB => "Zlib error.",
      ZipArchive::ER_CHANGED => "Entry has been changed.",
      ZipArchive::ER_COMPNOTSUPP => "Compression method not supported.",
      ZipArchive::ER_EOF => "Premature EOF.",
      ZipArchive::ER_INTERNAL => "Internal error.",
      ZipArchive::ER_REMOVE => "Can't remove file.",
      ZipArchive::ER_DELETED => "Entry has been deleted.",
      default => "Unknown error: $errorCode",
    };
  }
}

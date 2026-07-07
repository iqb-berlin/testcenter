<?php
declare(strict_types=1);

/**
 * Default driver: files live under DATA_DIR.
 */
class FilesystemDriver implements StorageDriver {

  private function abs(string $logicalPath): string {
    return DATA_DIR . '/' . ltrim($logicalPath, '/');
  }

  private function ensureDir(string $absPath): void {
    $dir = dirname($absPath);
    if (!is_dir($dir) and !mkdir($dir, 0777, true) and !is_dir($dir)) {
      throw new Exception("Could not create directory: `$dir`");
    }
  }

  public function put(string $logicalPath, string $localSourcePath): void {
    $target = $this->abs($logicalPath);

    // The staged file may already be at its final location (categorizeFile
    // rename()s before calling put()); that case is a no-op.
    if (realpath($localSourcePath) === realpath($target)) {
      return;
    }

    $this->ensureDir($target);
    if (!rename($localSourcePath, $target)) {
      throw new Exception("Could not move `$localSourcePath` to `$target`");
    }
  }

  public function putContents(string $logicalPath, string $contents): void {
    $target = $this->abs($logicalPath);
    $this->ensureDir($target);
    if (file_put_contents($target, $contents) === false) {
      throw new Exception("Could not write file: `$target`");
    }
  }

  public function get(string $logicalPath): string {
    $contents = file_get_contents($this->abs($logicalPath));
    if ($contents === false) {
      throw new Exception("Could not read file: `$logicalPath`");
    }
    return $contents;
  }

  public function getStream(string $logicalPath) {
    $handle = fopen($this->abs($logicalPath), 'rb');
    if ($handle === false) {
      throw new Exception("Could not open file: `$logicalPath`");
    }
    return $handle;
  }

  public function exists(string $logicalPath): bool {
    return file_exists($this->abs($logicalPath));
  }

  public function delete(string $logicalPath): void {
    $target = $this->abs($logicalPath);
    if (file_exists($target)) {
      unlink($target);
    }
  }

  public function copy(string $from, string $to): void {
    $target = $this->abs($to);
    $this->ensureDir($target);
    if (!copy($this->abs($from), $target)) {
      throw new Exception("Could not copy `$from` to `$to`");
    }
  }

  public function list(string $prefix): array {
    $base = $this->abs($prefix);
    if (!is_dir($base)) {
      return [];
    }

    $result = [];
    $iterator = new RecursiveIteratorIterator(
      new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS)
    );
    $dataRoot = rtrim(DATA_DIR, '/') . '/';
    foreach ($iterator as $fileInfo) {
      if ($fileInfo->isFile()) {
        $result[] = substr($fileInfo->getPathname(), strlen($dataRoot));
      }
    }
    return $result;
  }

  public function size(string $logicalPath): int {
    $target = $this->abs($logicalPath);
    return file_exists($target) ? (int) filesize($target) : 0;
  }

  public function mtime(string $logicalPath): int {
    $target = $this->abs($logicalPath);
    return file_exists($target) ? (int) filemtime($target) : 0;
  }

  public function presignGet(string $logicalPath, int $ttlSeconds): string {
    // No real presign on disk: keep the existing /fs-style relative URL.
    return '/' . ltrim($logicalPath, '/');
  }
}

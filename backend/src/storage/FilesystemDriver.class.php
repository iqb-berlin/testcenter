<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

use Psr\Http\Message\StreamInterface;
use Slim\Psr7\Stream;

/**
 * Keeps each file at its storage path below a root directory on disk. Directories on disk are created on write and
 * removed as soon as they are empty, so they exist exactly as long as storage directories do.
 */
class FilesystemDriver implements StorageDriver {
  function __construct(
    private readonly string $root
  ) {
  }

  public function put(StoragePath $path, string $localPath): void {
    $this->write($path, fn(string $diskPath): bool => copy($localPath, $diskPath));
  }

  public function putContents(StoragePath $path, string $contents): void {
    $this->write($path, fn(string $diskPath): bool => file_put_contents($diskPath, $contents) !== false);
  }

  public function get(StoragePath $path): string {
    $diskPath = $this->getDiskPath($path);
    $contents = is_file($diskPath) ? file_get_contents($diskPath) : false;
    if ($contents === false) {
      throw new Exception("Could not read `$path`.");
    }
    return $contents;
  }

  public function getStream(StoragePath $path): StreamInterface {
    $diskPath = $this->getDiskPath($path);
    $handle = is_file($diskPath) ? fopen($diskPath, 'rb') : false;
    if ($handle === false) {
      throw new Exception("Could not open `$path`.");
    }
    return new Stream($handle);
  }

  public function getFileInfo(StoragePath $path): ?FileInfo {
    $diskPath = $this->getDiskPath($path);
    // PHP caches stat results per path, and writing to a file does not clear them
    clearstatcache(true, $diskPath);
    if (!is_file($diskPath)) {
      return null;
    }
    return new FileInfo(filesize($diskPath), filemtime($diskPath));
  }

  public function listFiles(StorageDirectory $directory): array {
    $files = [];
    foreach ($this->listEntries($directory) as $name) {
      $fileInfo = $this->getFileInfo($directory->createFilePath($name));
      if ($fileInfo) {
        $files[$name] = $fileInfo;
      }
    }
    return $files;
  }

  public function listSubdirectories(StorageDirectory $directory): array {
    $diskDirectory = $this->getDiskDirectory($directory);
    return array_values(array_filter(
      $this->listEntries($directory),
      fn(string $name): bool => is_dir("$diskDirectory/$name")
    ));
  }

  public function delete(StoragePath $path): bool {
    $diskPath = $this->getDiskPath($path);
    if (!is_file($diskPath)) {
      return false;
    }
    if (!unlink($diskPath)) {
      throw new Exception("Could not delete `$path`.");
    }
    $this->removeEmptyDirectories($path->directory);
    return true;
  }

  public function deleteDirectory(StorageDirectory $directory): void {
    if ($directory->isRoot()) {
      throw new InvalidArgumentException('Refusing to delete the whole storage.');
    }
    $diskDirectory = $this->getDiskDirectory($directory);
    if (is_link($diskDirectory)) {
      if (!unlink($diskDirectory)) {
        throw new Exception("Could not delete `$directory`.");
      }
    } else if (is_dir($diskDirectory)) {
      $this->deleteTree($diskDirectory);
    }
    $this->removeEmptyDirectories($directory->getParent());
  }

  private function write(StoragePath $path, Closure $writeTo): void {
    $diskPath = $this->getDiskPath($path);
    // A concurrent delete removes the directory again if it is still empty, so it is created once more on failure.
    for ($attempt = 0; $attempt < 2; $attempt++) {
      $this->createDiskDirectory(dirname($diskPath));
      if (@$writeTo($diskPath)) {
        return;
      }
    }
    throw new Exception("Could not write `$path`.");
  }

  private function createDiskDirectory(string $diskDirectory): void {
    if (!is_dir($diskDirectory) and !@mkdir($diskDirectory, 0777, true) and !is_dir($diskDirectory)) {
      throw new Exception("Could not create directory `$diskDirectory`.");
    }
  }

  private function deleteTree(string $diskDirectory): void {
    foreach (array_diff(scandir($diskDirectory), ['.', '..']) as $name) {
      $diskPath = "$diskDirectory/$name";
      if (is_dir($diskPath) and !is_link($diskPath)) {
        $this->deleteTree($diskPath);
      } else if (!unlink($diskPath)) {
        throw new Exception("Could not delete `$diskPath`.");
      }
    }
    if (!rmdir($diskDirectory)) {
      throw new Exception("Could not delete `$diskDirectory`.");
    }
  }

  private function removeEmptyDirectories(StorageDirectory $directory): void {
    while (!$directory->isRoot() and @rmdir($this->getDiskDirectory($directory))) {
      $directory = $directory->getParent();
    }
  }

  /** @return string[] */
  private function listEntries(StorageDirectory $directory): array {
    $diskDirectory = $this->getDiskDirectory($directory);
    if (!is_dir($diskDirectory)) {
      return [];
    }
    $names = array_values(array_diff(scandir($diskDirectory), ['.', '..']));
    sort($names, SORT_STRING);
    return $names;
  }

  private function getDiskPath(StoragePath $path): string {
    return "$this->root/$path";
  }

  private function getDiskDirectory(StorageDirectory $directory): string {
    return rtrim("$this->root/$directory", '/');
  }
}

<?php
declare(strict_types=1);

use Psr\Http\Message\StreamInterface;

/**
 * Where files live. Unlike on a disk, a directory exists exactly as long as there are files in it: there are no
 * empty directories, and deleting the last file removes its directory too. URL signing and locking are not storage
 * concerns.
 */
interface StorageDriver {
  /** Stores a copy of the local file at $path, overwriting what is there. */
  public function put(StoragePath $path, string $localPath): void;

  public function putContents(StoragePath $path, string $contents): void;

  public function get(StoragePath $path): string;

  public function getStream(StoragePath $path): StreamInterface;

  /** null if there is no file at $path */
  public function getFileInfo(StoragePath $path): ?FileInfo;

  /** @return array<string, FileInfo> the files directly in $directory, keyed and sorted by name */
  public function listFiles(StorageDirectory $directory): array;

  /** @return string[] the names of the subdirectories directly in $directory, sorted */
  public function listSubdirectories(StorageDirectory $directory): array;

  /** @return bool false if there was no file at $path */
  public function delete(StoragePath $path): bool;

  /** Deletes $directory with everything in it. Refuses the root directory. */
  public function deleteDirectory(StorageDirectory $directory): void;
}

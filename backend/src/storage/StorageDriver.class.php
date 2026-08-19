<?php
declare(strict_types=1);

/**
 * Abstraction over where workspace files live.
 *
 * A "logical path" is the relative path already used everywhere as both the
 * file-server URI and the on-disk path under DATA_DIR, e.g.
 *   ws_3/Resource/iqb-player-aspect-2.12.3.html
 * Leading slashes are tolerated and normalized away.
 *
 * The FilesystemDriver maps a logical path to DATA_DIR/{logicalPath}; the
 * S3Driver maps it to the object key {logicalPath} in the configured bucket.
 */
interface StorageDriver {
  /** Move/upload a staged local file to the logical path. */
  public function put(string $logicalPath, string $localSourcePath): void;

  /** Write raw contents to the logical path. */
  public function putContents(string $logicalPath, string $contents): void;

  /** Read the full contents of the logical path. */
  public function get(string $logicalPath): string;

  /** Open a readable stream/handle for the logical path (for download passthrough). */
  public function getStream(string $logicalPath);

  public function exists(string $logicalPath): bool;

  public function delete(string $logicalPath): void;

  public function copy(string $from, string $to): void;

  /** List logical paths under a prefix. */
  public function list(string $prefix): array;

  public function size(string $logicalPath): int;

  public function mtime(string $logicalPath): int;

  /**
   * Return a URL the client can use to GET the object directly.
   * FilesystemDriver returns the existing /fs-style relative URL (no real
   * presign); S3Driver returns a time-limited presigned URL signed against
   * the public endpoint.
   */
  public function presignGet(string $logicalPath, int $ttlSeconds): string;
}

<?php
declare(strict_types=1);

readonly class FileInfo {
  function __construct(
    public int $size,
    public int $modificationTime
  ) {
  }
}

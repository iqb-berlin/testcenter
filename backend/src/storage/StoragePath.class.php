<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

/** Exactly one file in storage, e.g. `ws_1/Resource/player.html`. */
readonly class StoragePath {
  function __construct(
    public StorageDirectory $directory,
    public string $name
  ) {
    StorageDirectory::validateSegment($name);
  }

  static function fromString(string $path): StoragePath {
    $segments = explode('/', $path);
    $name = array_pop($segments);
    return new StoragePath(new StorageDirectory(...$segments), $name);
  }

  function __toString(): string {
    return $this->directory . $this->name;
  }
}

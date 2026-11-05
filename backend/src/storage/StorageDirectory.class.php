<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

/**
 * A directory in storage, e.g. `ws_1/Resource/`. It exists exactly as long as there are files in it.
 * Together with StoragePath the only place where storage paths are built and validated.
 */
readonly class StorageDirectory {
  /** @var string[] */
  public array $segments;

  function __construct(string ...$segments) {
    foreach ($segments as $segment) {
      self::validateSegment($segment);
    }
    $this->segments = array_values($segments);
  }

  static function root(): StorageDirectory {
    return new StorageDirectory();
  }

  /** `ws_1/Resource` and `ws_1/Resource/` are the same directory; the empty string is the root. */
  static function fromString(string $directory): StorageDirectory {
    if ($directory === '') {
      return self::root();
    }
    if (str_ends_with($directory, '/')) {
      $directory = substr($directory, 0, -1);
    }
    return new StorageDirectory(...explode('/', $directory));
  }

  static function validateSegment(string $segment): void {
    if (in_array($segment, ['', '.', '..'], true) or str_contains($segment, '/') or str_contains($segment, "\0")) {
      throw new InvalidArgumentException("Invalid storage path segment: `$segment`");
    }
  }

  function isRoot(): bool {
    return !count($this->segments);
  }

  function getParent(): StorageDirectory {
    if ($this->isRoot()) {
      throw new LogicException('The root directory has no parent.');
    }
    return new StorageDirectory(...array_slice($this->segments, 0, -1));
  }

  function createSubdirectory(string ...$segments): StorageDirectory {
    return new StorageDirectory(...$this->segments, ...$segments);
  }

  function createFilePath(string $name): StoragePath {
    return new StoragePath($this, $name);
  }

  function __toString(): string {
    return $this->isRoot() ? '' : implode('/', $this->segments) . '/';
  }
}

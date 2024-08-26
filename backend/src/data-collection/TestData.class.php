<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class TestData extends DataCollectionTypeSafe {
  function __construct(
    public readonly int $id,
    public readonly string $name,
    public readonly string $bookletFileId,
    public readonly string $label,
    public readonly string $description,
    public readonly bool $locked,
    public readonly bool $running,
    public readonly object $state,
  ) {
  }
}

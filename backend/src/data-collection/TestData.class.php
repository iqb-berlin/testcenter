<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class TestData extends DataCollectionTypeSafe {
  public readonly int $id;
  public readonly string $bookletId;
  public readonly string $label;
  public readonly string $description;
  public readonly bool $locked;
  public readonly bool $running;
  public readonly object $state;

  function __construct(
    int $id,
    string $bookletId,
    string $label,
    string $description,
    bool $locked,
    bool $running,
    object $state,
  ) {
    $this->id = $id;
    $this->bookletId = $bookletId;
    $this->label = $label;
    $this->description = $description;
    $this->locked = $locked;
    $this->running = $running;
    $this->state = $state;
  }
}

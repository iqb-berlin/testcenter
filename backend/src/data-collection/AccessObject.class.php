<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class AccessObject extends DataCollectionTypeSafe {
  public readonly string $id;
  public readonly string $type;
  public readonly string $label;
  public readonly array $flags;

  public function __construct(
    string $id,
    AccessObjectType $type,
    string $label,
    array $flags = []
  ) {
    $this->id = $id;
    $this->type = $type->value;
    $this->label = $label;
    $this->flags = $flags;
  }

}
<?php

declare(strict_types=1);

class SystemCheckAccessObject extends AccessObject {
  public function __construct(
    readonly public string $workspaceId,
    string $id,
    AccessObjectType $type,
    string $label,
    public readonly string $description,
    array $flags = []
  ) {
    parent::__construct(
      $id,
      $type,
      $label,
      $flags
    );
  }

}
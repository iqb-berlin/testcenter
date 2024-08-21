<?php

declare(strict_types=1);

class SystemCheckAccessObject extends AccessObject {
  public function __construct(
    protected string $workspaceId,
    string $id,
    string $type,
    string $label,
    protected string $description,
    array $flags = []
  ) {
    parent::__construct(
      $id,
      $type,
      $label,
      $flags
    );
  }

  public function getWorkspaceId(): string {
    return $this->workspaceId;
  }

}
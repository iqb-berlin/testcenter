<?php

declare(strict_types=1);

class SystemCheck extends DataCollectionTypeSafe {

  public function __construct(
    protected string $workspaceId,
    protected string $id,
    protected string $name,
    protected string $label,
    protected string $description
  ) {
  }

  public function getId(): string {
    return $this->id;
  }

  public function getDescription(): string {
    return $this->description;
  }

  public function getLabel(): string {
    return $this->label;
  }

  public function getName(): string {
    return $this->name;
  }

  public function getWorkspaceId(): string {
    return $this->workspaceId;
  }

}
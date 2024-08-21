<?php

declare(strict_types=1);

class SystemCheck extends DataCollectionTypeSafe {

  public function __construct(
    private string $workspaceId,
    private string $id,
    private string $name,
    private string $label,
    private string $description
  ) {
  }

  public function getId(): string {
    return $this->id;
  }

  public function setId(string $id): void {
    $this->id = $id;
  }

  public function getDescription(): string {
    return $this->description;
  }

  public function setDescription(string $description): void {
    $this->description = $description;
  }

  public function getLabel(): string {
    return $this->label;
  }

  public function setLabel(string $label): void {
    $this->label = $label;
  }

  public function getName(): string {
    return $this->name;
  }

  public function setName(string $name): void {
    $this->name = $name;
  }

  public function getWorkspaceId(): string {
    return $this->workspaceId;
  }

  public function setWorkspaceId(string $workspaceId): void {
    $this->workspaceId = $workspaceId;
  }

}
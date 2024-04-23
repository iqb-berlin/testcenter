<?php
declare(strict_types=1);

class FileData extends DataCollectionTypeSafe {
  protected string|null $type = null;
  protected string $path = '';
  protected string $id = '';
  protected string $label = '';
  protected string $description = '';
  protected ?array $relations = [];
  private bool $isValid;
  protected array $validationReport = ['warning' => [], 'error' => [], 'info' => []];
  protected int $modificationTime = 0;
  protected int $size = 0;
  protected array $contextData = [];
  protected string $veronaModuleType = '';
  protected string $veronaModuleId;
  protected int $versionMayor;
  protected int $versionMinor;
  protected int $versionPatch;
  protected string $versionLabel;
  protected string $veronaVersion;

  public function __construct(
    string $path = '',
    string $type = null,
    string $id = '',
    string $label = '',
    string $description = '',
    bool   $isValid = true,
    array  $validationReport = [],
    ?array  $relations = null,
    int    $modificationTime = 1,
    int    $size = 0,
    array  $contextData = [],
    string $veronaModuleType = "",
    string $veronaModuleId = "",
    int    $versionMayor = 0,
    int    $versionMinor = 0,
    int    $versionPatch = 0,
    string $versionLabel = "",
    string $veronaVersion = ""
  ) {
    $this->path = $path;
    $this->type = $type;
    $this->id = $id;
    $this->label = $label;
    $this->description = $description;
    $this->isValid = $isValid;
    $this->validationReport = $validationReport ?? ['warning' => [], 'error' => [], 'info' => []];
    $this->relations = $relations;
    $this->modificationTime = $modificationTime;
    $this->size = $size;
    $this->contextData = $contextData;
    $this->veronaModuleType = $veronaModuleType;
    $this->veronaModuleId = $veronaModuleId;
    $this->versionMayor = $versionMayor;
    $this->versionMinor = $versionMinor;
    $this->versionPatch = $versionPatch;
    $this->versionLabel = $versionLabel;
    $this->veronaVersion = $veronaVersion;
  }

  public function getType(): string {
    return $this->type;
  }

  public function getPath(): string {
    return $this->path;
  }

  public function getSize(): int {
    return $this->size;
  }

  public function getId(): string {
    return $this->id;
  }

  public function setId(string $newId): void {
    $this->id = $newId;
  }

  public function getLabel(): string {
    return $this->label;
  }

  public function getDescription(): string {
    return $this->description;
  }

  public function getRelations(): array {
    return $this->relations;
  }

  public function isValid(): bool {
    return $this->isValid;
  }

  public function getValidationReport(): array {
    return $this->validationReport;
  }

  public function getModificationTime(): int {
    return $this->modificationTime;
  }

  public function getContextData(): array {
    return $this->contextData;
  }

  public function getVeronaModuleType(): string {
    return $this->veronaModuleType;
  }

  public function getVeronaModuleId(): string {
    return $this->veronaModuleId;
  }

  public function getVersionMayor(): int {
    return $this->versionMayor;
  }

  public function getVersionMinor(): int {
    return $this->versionMinor;
  }

  public function getVersionPatch(): int {
    return $this->versionPatch;
  }

  public function getVersionLabel(): string {
    return $this->versionLabel;
  }

  public function getVeronaVersion(): string {
    return $this->veronaVersion;
  }
}
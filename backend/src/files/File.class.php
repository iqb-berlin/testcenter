<?php
declare(strict_types=1);

class File extends FileData {
  private const type = 'file';
  public const canBeRelationSubject = false;
  public const canBeRelationObject = false;
  protected string $name = '';
  protected ?string $content = null;

  static function get(StoragePath|FileData $init, string $type): File {
    return match ($type) {
      'Testtakers' => new XMLFileTesttakers($init),
      'SysCheck' => new XMLFileSysCheck($init),
      'Booklet' => new XMLFileBooklet($init),
      'Unit' => new XMLFileUnit($init),
      'Resource' => new ResourceFile($init),
      'xml' => new XMLFile($init),
      default => new File($init),
    };
  }

  /** A file that is not in storage, created from its content. */
  static function fromString(string $fileContent, string $fileName = 'virtual_file'): static {
    $file = new static(new FileData());
    $file->name = basename($fileName);
    $file->id = strtoupper($file->name);
    $file->content = $fileContent;
    $file->validate();
    return $file;
  }

  /** Like fromString(), but the subclass is determined from the file's name and content. */
  static function fromStringOfAnyType(string $fileContent, string $fileName): File {
    return match (File::determineType($fileContent, $fileName)) {
      'Testtakers' => XMLFileTesttakers::fromString($fileContent, $fileName),
      'SysCheck' => XMLFileSysCheck::fromString($fileContent, $fileName),
      'Booklet' => XMLFileBooklet::fromString($fileContent, $fileName),
      'Unit' => XMLFileUnit::fromString($fileContent, $fileName),
      'Resource' => ResourceFile::fromString($fileContent, $fileName),
      'xml' => XMLFile::fromString($fileContent, $fileName),
    };
  }

  // TODO unit-test
  public static function determineType(string $fileContent, string $fileName): string {
    if (strtoupper(substr($fileName, -4)) == '.XML') {
      $asGenericXmlFile = XMLFile::fromString($fileContent, $fileName);
      if (!in_array($asGenericXmlFile->rootTagName, XMLFile::knownRootTags)) {
        return 'xml';
      }
      return $asGenericXmlFile->rootTagName;
    } else {
      return 'Resource';
    }
  }

  public function __construct(StoragePath|FileData $init) {
    if (is_a($init, FileData::class)) {
      $this->path = $init->path;
      $this->type = $init->type;
      $this->id = $init->id;
      $this->label = $init->label;
      $this->description = $init->description;
      $this->validationReport = $init->validationReport;
      $this->relations = $init->relations;
      $this->modificationTime = $init->modificationTime;
      $this->size = $init->size;
      $this->name = $init->path?->name ?? '';
      $this->contextData = $init->contextData;
      $this->veronaModuleType = $init->veronaModuleType;
      $this->veronaModuleId = $init->veronaModuleId;
      $this->versionMayor = $init->versionMayor;
      $this->versionMinor = $init->versionMinor;
      $this->versionPatch = $init->versionPatch;
      $this->versionLabel = $init->versionLabel;
      $this->veronaVersion = $init->veronaVersion;
      return;
    }

    parent::__construct();

    $exists = $this->readFileMeta($init);
    $this->id = strtoupper($this->getName());

    if ($exists) {
      $this->load();
    }
  }

  /** @return bool whether the file exists */
  public function readFileMeta(StoragePath $path): bool { // TODO can this be private / merged with load?
    $this->path = $path;
    $this->name = $path->name;
    $fileInfo = Storage::getDriver()->getFileInfo($path);

    if (!$fileInfo) {
      $this->size = 0;
      $this->modificationTime = 1;
      $this->report('error', "File does not exist: `$path`");
      return false;
    }

    $this->size = $fileInfo->size;
    $this->modificationTime = $fileInfo->modificationTime;
    return true;
  }

  protected function load(): void {
    if (($this->content === null) and $this->path) {
      $this->content = Storage::getDriver()->get($this->path);
      $this->validate();
    }
  }

  protected function validate(): void {
    if (strlen($this->name) > 120) {
      $this->report('error', "Filename too long!");
    }
  }

  public function getType(): string {
    return $this->type ?? $this::type;
  }

  public function getName(): string {
    return $this->name;
  }

  public function getVersion(): string {
    return Version::asString($this->versionMayor, $this->versionMinor, $this->versionPatch, $this->versionLabel) ?? '';
  }

  public function getVersionMayorMinor(): string {
    return "$this->versionMayor.$this->versionMinor";
  }

  public function isValid(): bool {
    return count($this->validationReport['error'] ?? []) == 0;
  }

  public function report(string $level, string $message): void {
    if (isset($this->validationReport[$level]) and count($this->validationReport[$level]) == 5) {
      $aggregated = str_ends_with($this->validationReport[$level][4], " more {$level}s.") ? (int) $this->validationReport[$level][4] : 1;
      $this->validationReport[$level][4] = ($aggregated + 1) . " more {$level}s.";
    } else {
      $this->validationReport[$level][] = $message;
    }
  }

  // TODO unit-test
  public function crossValidate(WorkspaceCache $workspaceCache): void {
    if ($duplicateId = $workspaceCache->getDuplicateId($this)) {
      $origFile = $workspaceCache->getFile($this->getType(), $this->getId());

      $this->report('error', "Duplicate {$this->getType()}-Id: `{$this->getId()}` ({$origFile->getName()})");
      $this->id = $duplicateId;
    }
  }

  public function addRelation(FileRelation $relation): void {
    $this->relations[] = $relation;
  }

  public function jsonSerialize(): mixed {
    $info = [
      'label' => $this->getLabel(),
      'description' => $this->getDescription(),
    ];
    if ($this->veronaModuleType) {
      $info['veronaModuleType'] = $this->veronaModuleType;
      $info['veronaVersion'] = $this->veronaVersion;
      $info['version'] = $this->getVersion();
    }

    return [
      'name' => $this->name,
      'size' => $this->size,
      'modificationTime' => $this->modificationTime,
      'type' => $this->type,
      'id' => $this->id,
      'report' => $this->validationReport,
      'dependencies' => $this->relations,
      'info' => array_merge($info, $this->getContextData()
      ),
    ];
  }

  public function getContent(): string {
    $this->load();
    return $this->content;
  }
}


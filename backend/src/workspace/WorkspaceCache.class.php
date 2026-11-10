<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class WorkspaceCache {
  protected array $cachedFiles = [];
  protected array $duplicates = [];
  protected array $used = [];
  protected Workspace $workspace;
  protected array $globalIds = []; // type => [id => fileName]
  protected ?array $assetOriginalNames = null;

  function __construct(Workspace $workspace) {
    $this->workspace = $workspace;
    $this->setGlobalIds();
    $this->initializeFilesArray();
  }

  public function loadFiles(): void {
    foreach (Workspace::subFolders as $type) {
      $directory = $this->workspace->getStorageDirectory()->createSubdirectory($type);
      $files = array_reverse($this->workspace->listFilesOfType($type), true);

      foreach ($files as $fileName => $fileInfo) {
        $this->addFile($type, Workspace::loadAndValidateFile($directory->createFilePath($fileName), $type, $fileInfo));
      }
    }
  }

  /** Validates all cached files; they have to come with their content. */
  public function validate(): void {
    $files = [];
    foreach ($this->cachedFiles as $fileSet) {
      /** @var File $file */
      foreach ($fileSet as $file) {
        $file->crossValidate($this);
        $files[] = $file;
      }
    }

    $this->rejectSecondWidgetsForAModel($files);
    $this->markUnusedItems($files);
  }

  /**
   * Cross-validates files that are about to be stored against the cached files, and checks whether they are used.
   * What stored files refer to is passed in, as it comes from the database.
   * @param list<File> $files the files that are depended on come first
   * @param array<string, array<string, true>> $usedByStoredFiles type => upper-case id => true
   */
  public function validateNewFiles(array $files, array $usedByStoredFiles): void {
    foreach ($files as $file) {
      $file->crossValidate($this);
    }

    $this->rejectSecondWidgetsForAModel($files);
    $this->markUnusedItems($files, $usedByStoredFiles);
  }

  /**
   * Temporary, see Workspace::getWidgets: widgets are found by model, so with two widgets for a model (each in any
   * number of versions) the one delivered would be a guess. The check runs at upload and initialization only: after
   * deleting one of two such widgets, the other stays invalid until it is uploaded again.
   * @param list<File> $filesToReport the widgets among them get the error; all cached widgets count
   */
  private function rejectSecondWidgetsForAModel(array $filesToReport): void {
    /** @var array<string, array<string, list<FileData>>> $widgetsByModel model => module id => files */
    $widgetsByModel = [];
    /** @var FileData $resource */
    foreach ($this->cachedFiles['Resource'] ?? [] as $resource) {
      // a widget that is invalid for another reason is never delivered, so it can't be confused with the others
      if ($resource->getVeronaModuleType() !== 'widget' or !$resource->getVeronaModel() or !$resource->isValid()) {
        continue;
      }
      $widgetsByModel[$resource->getVeronaModel()][$resource->getVeronaModuleId()][] = $resource;
    }
    foreach ($widgetsByModel as $model => $widgets) {
      if (count($widgets) < 2) {
        continue;
      }
      $moduleIds = implode('`, `', array_keys($widgets));
      foreach (array_merge(...array_values($widgets)) as $widget) {
        if (in_array($widget, $filesToReport, true)) {
          $widget->report('error', "Only one widget per model allowed: `$moduleIds` are all widgets for `$model`.");
        }
      }
    }
  }

  public function getId(): int {
    return $this->workspace->getId();
  }

  public function getFiles(bool $flat = false): array {
    if (!$flat) {
      return $this->cachedFiles;
    }

    $files = [];

    foreach ($this->cachedFiles as $fileSet) {
      foreach ($fileSet as /** @var File */ $file) {
        $files[(string) $file->getPath()] = $file;
      }
    }

    return $files;
  }

  public function getDuplicateId(FileData $file): ?string {
    return $this->duplicates["{$file->getType()}/{$file->getName()}"] ?? null;
  }

  public function getFile(string $type, string $fileId): ?FileData {
    return $this->cachedFiles[$type][$fileId] ?? null;
  }

  public function getResource(string $resourceId): ?FileData {
    return $this->cachedFiles['Resource'][$resourceId] ?? null;
  }

  public function getUnit(string $unitId): ?FileData {
    return $this->cachedFiles['Unit'][$unitId] ?? null;
  }

  public function getBooklet(string $bookletId): ?FileData {
    return $this->cachedFiles['Booklet'][$bookletId] ?? null;
  }

  public function getSysCheck(string $sysCheckId): ?FileData {
    return $this->cachedFiles['SysCheck'][$sysCheckId] ?? null;
  }

  /** Stored files only need their metadata; files that are validated come with their content. */
  public function addFile(string $type, FileData $file, $overwriteAllowed = false): string {
    $index = $file->getId();

    if (isset($this->cachedFiles[$type][$index])) {
      $duplicate = $this->cachedFiles[$type][$index];

      if (!$overwriteAllowed or ($file->getName() !== $duplicate->getName())) {
        $index = md5(microtime());
        $this->duplicates["{$file->getType()}/{$file->getName()}"] = $index;
      }
    }

    $this->cachedFiles[$type][$index] = $file;

    return "$type/{$file->getId()}";
  }

  /**
   * @param list<File> $files
   * @param array<string, array<string, true>> $usedByStoredFiles type => upper-case id => true
   */
  private function markUnusedItems(array $files, array $usedByStoredFiles = []): void {
    $used = $usedByStoredFiles;

    foreach ($files as $file) {
      if ($file::canBeRelationSubject) {
        /** @var FileRelation $relation */
        foreach ($file->getRelations() as $relation) {
          $used[$relation->getTargetType()][strtoupper($relation->getTargetName())] = true;
        }
      }
    }

    foreach ($files as $file) {
      if ($file::canBeRelationObject and !isset($used[$file->getType()][strtoupper($file->getId())])) {
        $file->report('warning', "{$file->getType()} is never used");
      }
    }
  }

  public function setGlobalIds(): void {
    $this->globalIds = $this->workspace->workspaceDAO->getGlobalIds();
  }

  public function getGlobalIds(): array {
    return $this->globalIds;
  }

  private function initializeFilesArray(): void {
    foreach (Workspace::subFolders as $type) {
      $this->cachedFiles[$type] = [];
    }
  }

  public function addGlobalIdSource(string $fileName, string $type, array $idList): void {
    $this->globalIds[$this->getId()][$fileName][$type] = $idList;
  }

  public function hasAsset(string $originalName): bool {
    if ($this->assetOriginalNames === null) {
      $this->assetOriginalNames = [];
      foreach ((new AssetDAO())->getAllAssets() as $asset) {
        $this->assetOriginalNames[$asset['original_name']] = true;
      }
    }

    return isset($this->assetOriginalNames[$originalName]);
  }
}

<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class WorkspaceCache {
  protected array $cachedFiles = [];
  protected array $duplicates = [];
  protected array $used = [];
  protected Workspace $workspace;
  protected array $globalIds = []; // type => [id => fileName]

  function __construct(Workspace $workspace) {
    $this->workspace = $workspace;
    $this->setGlobalIds();
    $this->initializeFilesArray();
  }

  public function loadFiles(): void {
    foreach (Workspace::subFolders as $type) {
      $pattern = ($type == 'Resource') ? "*.*" : "*.[xX][mM][lL]";
      $filePaths = Folder::glob($this->workspace->getOrCreateSubFolderPath($type), $pattern, true);

      foreach ($filePaths as $filePath) {
        $file = File::get($filePath, $type);
        $this->addFile($type, $file);
      }
    }
  }
  public function loadFilesPerTypeFromDb(FileType $fileType): void {

    foreach (FileType::getDependantTypes($fileType) as $type) {
      $pattern = ($type == 'Resource') ? "*.*" : "*.[xX][mM][lL]";
      $filePaths = Folder::glob($this->workspace->getOrCreateSubFolderPath($type), $pattern, true);

      foreach ($filePaths as $filePath) {
        $file = File::get($filePath, $type);
        $this->addFile($type, $file);
      }
    }
  }

  public function validate(): void {
    foreach ($this->cachedFiles as $fileSet) {
      foreach ($fileSet as $file) {
        /* @var $file File */
        $file->crossValidate($this);
      }
    }

    $this->markUnusedItems();
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
        $files[$file->getPath()] = $file;
      }
    }

    return $files;
  }

  public function getDuplicateId(File $file): ?string {
    return $this->duplicates["{$file->getType()}/{$file->getName()}"] ?? null;
  }

  public function getFile(string $type, string $fileId): ?File {
    return $this->cachedFiles[$type][$fileId] ?? null;
  }

  public function getResource(string $resourceId): ?ResourceFile {
    return $this->cachedFiles['Resource'][$resourceId] ?? null;
  }

  public function getUnit(string $unitId): ?XMLFileUnit {
    return $this->cachedFiles['Unit'][$unitId] ?? null;
  }

  public function getBooklet(string $bookletId): ?XMLFileBooklet {
    return $this->cachedFiles['Booklet'][$bookletId] ?? null;
  }

  public function getSysCheck(string $sysCheckId): ?XMLFileSysCheck {
    return $this->cachedFiles['SysCheck'][$sysCheckId] ?? null;
  }

  public function addFile(string $type, File $file, $overwriteAllowed = false): string {
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

  public function markUnusedItems(): void {
    $relationsMap = [];

    foreach (Workspace::subFolders as $type) {
      foreach ($this->cachedFiles[$type] as $file) {
        /* @var $file File */
        if ($file::canBeRelationSubject) {
          $relations = $file->getRelations();
          foreach ($relations as $relation) {
            /* @var FileRelation $relation */
            $relationsMap[$relation->getTargetType()][strtoupper($relation->getTargetName())] = $file->getName();
          }
        }
      }
    }

    foreach (Workspace::subFolders as $type) {
      foreach ($this->cachedFiles[$type] as $file) {
        /* @var $file File */

        if ($file::canBeRelationObject and !isset($relationsMap[$file->getType()][strtoupper($file->getId())])) {
          $file->report('warning', "{$file->getType()} is never used");
        }
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
}

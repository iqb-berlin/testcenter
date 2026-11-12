<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Workspace {
  protected int $workspaceId = 0;
  protected StorageDirectory $storageDirectory;
  public WorkspaceDAO $workspaceDAO;

  // dont' change order, it's the order of possible dependencies
  const subFolders = ['Resource', 'Unit', 'Booklet', 'Testtakers', 'SysCheck'];

  static function getAll(): array {
    $workspaces = [];
    $class = get_called_class();

    foreach (Storage::getDriver()->listSubdirectories(StorageDirectory::root()) as $workspaceDir) {
      if (!fnmatch('ws_*', $workspaceDir)) {
        continue;
      }
      $workspaceFolderNameParts = explode('_', $workspaceDir);
      $workspaceId = (int) array_pop($workspaceFolderNameParts);
      if (!$workspaceId) {
        continue;
      }
      $workspace = new $class($workspaceId);
      // storage may still list the directory of a workspace whose files are all deleted
      if (!array_sum($workspace->countFilesOfAllSubFolders())) {
        continue;
      }
      $workspaces[$workspaceId] = $workspace;
    }

    return $workspaces;
  }

  public function hasFilesChanged(string $currentHash): bool {
    $originalHash = $this->workspaceDAO->getWorkspaceHash();
    return $currentHash !== $originalHash;
  }

  static function getStorageDirectoryOf(int $workspaceId): StorageDirectory {
    return StorageDirectory::root()->createSubdirectory("ws_$workspaceId");
  }

  function __construct(int $workspaceId) {
    $this->workspaceId = $workspaceId;
    $this->storageDirectory = self::getStorageDirectoryOf($workspaceId);
    $this->workspaceDAO = new WorkspaceDAO($this->workspaceId);
  }

  public function getId(): int {
    return $this->workspaceId;
  }

  public function getStorageDirectory(): StorageDirectory {
    return $this->storageDirectory;
  }

  /**
   * The only sanctioned way to turn request input (type, file name) into a workspace
   * file path. Returns null if the type is unknown or the name is no valid path inside
   * the type's directory. Whether the file exists is not checked.
   */
  public function getFilePath(string $type, string $fileName): ?StoragePath {
    if (!in_array($type, self::subFolders)) {
      return null;
    }

    try {
      return StoragePath::fromString($this->storageDirectory->createSubdirectory($type) . $fileName);
    } catch (InvalidArgumentException) {
      return null;
    }
  }

  public function deleteFiles(array $filesToDelete): FileDeletionReport {
    $deletionReport = new FileDeletionReport();

    $cachedFilesToDelete = $this->workspaceDAO->getFiles($filesToDelete, true);
    $blockedFiles = $this->workspaceDAO->getBlockedFiles(array_merge(...array_values($cachedFilesToDelete)));

    foreach ($filesToDelete as $localFilePath) {
      $pathParts = explode('/', $localFilePath, 2);

      if (count($pathParts) < 2) {
        $deletionReport->incorrect_path[] = $localFilePath;
        continue;
      }

      list($type, $name) = $pathParts;

      try {
        $path = StoragePath::fromString($this->storageDirectory . $localFilePath);
      } catch (InvalidArgumentException) {
        $deletionReport->incorrect_path[] = $localFilePath;
        continue;
      }

      $cachedFile = $cachedFilesToDelete[$type][$name] ?? null;

      // only files of the file list; other files in the workspace's storage, such as unpacked packages or
      // attachments, are managed by what they belong to
      if (!$cachedFile) {
        $deletionReport->did_not_exist[] = $localFilePath;
        continue;
      }

      if (isset($blockedFiles[$localFilePath])) {
        $deletionReport->was_used[] = $localFilePath;
        continue;
      }

      if (!$this->deleteFileFromDb($cachedFile)) {
        $deletionReport->error[] = $localFilePath;
        continue;
      }
      self::deleteFromStorage($path, $deletionReport, $localFilePath);
    }

    $this->workspaceDAO->updateContentTypeBasedOnRemainingTesttakers();

    return $deletionReport;
  }

  /** Deletes the file at $path and records the outcome under $entry in $deletionReport. */
  protected static function deleteFromStorage(
    StoragePath $path,
    FileDeletionReport $deletionReport,
    string $entry
  ): void {
    try {
      Storage::getDriver()->delete($path);
      $deletionReport->deleted[] = $entry;
    } catch (Exception $e) {
      error_log($e->getMessage());
      $deletionReport->not_allowed[] = $entry;
    }
  }

  private function deleteFileFromDb(FileData $file): bool {
    try {
      if ($file->getType() === 'Testtakers') {
        $this->workspaceDAO->deleteLoginSource($file->getName());
        $this->workspaceDAO->deleteAssetAssignmentSource($file->getName());
      }

      if ($file->getType() === 'Resource' and ResourceFile::isPackage($file->getName())) {
        ResourceFile::uninstallPackage($file->getPath());
      }

      $this->workspaceDAO->deleteFile($file);

    } catch (Exception $e) {
      error_log($e->getMessage());
      return false;
    }
    return true;
  }

  /** takes files from the workspace-dir toplevel and puts it to the correct subdir if valid
   * @return array{
   *   type: string,
   *   warning: array,
   *   error: array,
   *   info: array}
   */
  public function importUncategorizedFiles(string $stagingPath, array $fileNames): array {
    $toSortInFilePaths = [];
    foreach ($fileNames as $fileName) {
      if (FileExt::has($fileName, 'ZIP') and !FileExt::has($fileName, 'ITCR.ZIP')) {
        array_push($toSortInFilePaths, ...$this->unpackRootlevelZipArchive($stagingPath, $fileName));
      } else {
        $toSortInFilePaths[] = $fileName;
      }
    }

    return $this->sortAndValidateToplevelFiles($stagingPath, $toSortInFilePaths);
  }

  private function sortAndValidateToplevelFiles(string $stagingPath, array $relativeFilePaths): array {
    $filesAfterSorting = [];
    $filesPerType = array_fill_keys([...Workspace::subFolders, 'xml'], []);

    foreach ($relativeFilePaths as $relativeFilePath) {
      $file = File::fromStringOfAnyType(file_get_contents("$stagingPath/$relativeFilePath"), $relativeFilePath);
      $filesPerType[$file->getType()][$relativeFilePath] = $file;
    }

    $filesPerType = [
      // Resource and Unit are merged in order to save one call to getFilesWhere(['type' => 'Resource']), as this is the
      // most expensive call in the following loop (Unit depends on Resource anyway)
      !empty($filesPerType['Unit']) ? 'Unit' : 'Resource' => array_merge(
        $filesPerType['Resource'],
        $filesPerType['Unit']
      ),
      'Booklet' => $filesPerType['Booklet'],
      'Testtakers' => $filesPerType['Testtakers'],
      'SysCheck' => $filesPerType['SysCheck'],
      'xml' => $filesPerType['xml']
    ];

    foreach ($filesPerType as $type => $files) {
      if (!empty($files)) {
        // these files are all not valid from the start
        if ($type === 'xml') {
          foreach ($files as $filePath => $file) {
            $filesAfterSorting[$filePath] = ['type' => $file->getType(), ...$file->getValidationReport()];
          }
          continue;
        }

        $this->validateFilesForCategory($files, FileType::tryFrom($type));
        foreach ($files as $filePath => $file) {
          if ($file->isValid() and $this->categorizeFile("$stagingPath/$filePath", $file)) {
            $this->workspaceDAO->storeFile($file);
            $this->storeFileMeta($file);
            $this->updateDependentFiles($file);
          }

          $filesAfterSorting[$filePath] = ['type' => $file->getType(), ...$file->getValidationReport()];
        }
      }
    }

    $this->workspaceDAO->updateContentTypeBasedOnRemainingTesttakers();

    return $filesAfterSorting;
  }

  /** @param array<string, File> $files */
  protected function validateFilesForCategory(array $files, FileType $highestTypeAmongFiles): void {
    $workspaceCache = new WorkspaceCache($this);
    $this->loadFilesIntoCache($workspaceCache, $highestTypeAmongFiles);

    foreach ($files as $file) {
      $workspaceCache->addFile($file->getType(), $file, true);
    }

    // Resources uploaded together with units come in as one category (see sortAndValidateToplevelFiles), but each
    // type needs its own cross-validation, e.g. against duplicate ids. Dependencies first.
    $typeOrder = array_reverse(FileType::getDependenciesOfType($highestTypeAmongFiles));
    $filesInOrder = array_values($files);
    usort(
      $filesInOrder,
      static fn(File $a, File $b): int => array_search($a->getType(), $typeOrder) <=> array_search($b->getType(), $typeOrder)
    );

    $workspaceCache->validateNewFiles($filesInOrder, $this->getUsedByStoredFiles($files));
  }

  /**
   * What stored files of the uploaded types relate to - except those the upload replaces.
   * @param array<string, File> $uploadedFiles
   * @return array<string, array<string, true>> type => upper-case id => true
   */
  private function getUsedByStoredFiles(array $uploadedFiles): array {
    $replaced = [];
    foreach ($uploadedFiles as $file) {
      $replaced["{$file->getType()}/{$file->getName()}"] = true;
    }
    $uploadedTypes = array_values(array_unique(array_map(static fn(File $file): string => $file->getType(), $uploadedFiles)));

    $used = [];
    foreach ($this->workspaceDAO->getRelations($uploadedTypes) as $relation) {
      if (!isset($replaced["{$relation['subject_type']}/{$relation['subject_name']}"])) {
        $used[$relation['object_type']][strtoupper($relation['object_id'])] = true;
      }
    }
    return $used;
  }

  protected function categorizeFile(string $stagedFilePath, File $file): bool {
    $targetStoragePath = $this->storageDirectory
      ->createSubdirectory($file->getType())
      ->createFilePath($file->getName());

    if ($oldFileInfo = Storage::getDriver()->getFileInfo($targetStoragePath)) {
      $oldFile = self::loadAndValidateFile($targetStoragePath, $file->getType(), $oldFileInfo);

      if ($oldFile->getId() !== $file->getId()) {
        $file->report(
          'error',
          "File of name `{$oldFile->getName()}` did already exist. "
          . "Overwriting was rejected since new file's ID (`{$file->getId()}`) differs from old one (`{$oldFile->getId()}`)."
        );
        return false;
      }

      if ($oldFile->getVeronaModuleId() !== $file->getVeronaModuleId()) {
        $file->report(
          'error',
          "File of name `{$oldFile->getName()}` did already exist. "
          . "Overwriting was rejected since new file's Verona-Module-ID (`{$file->getVeronaModuleId()}`) differs from old one (`{$oldFile->getVeronaModuleId()}`)."
          . "Filenames not according to the Verona-standard are a bad idea anyway and and will be forbidden in the future."
        );
        return false;
      }

      if (!Version::isCompatible($oldFile->getVersion(), $file->getVersion())) {
        $file->report(
          'error',
          "File of name `{$oldFile->getName()}` did already exist. "
          . "Overwriting was rejected since version conflict between old ({$oldFile->getVersion()}) and new ({$file->getVersion()}) file."
          . "Filenames not according to the Verona-standard are a bad idea anyway and and will be forbidden in the future."
        );
        return false;
      }

      $file->report('warning', "File of name `{$oldFile->getName()}` did already exist and was overwritten.");
    }

    Storage::getDriver()->put($targetStoragePath, $stagedFilePath);
    $file->setStorageInfo(
      $targetStoragePath,
      Storage::getDriver()->getFileInfo($targetStoragePath)
        ?? throw new Exception("File not found in storage right after storing it: `$targetStoragePath`")
    );

    return true;
  }

  /** @return string[] the paths of the extracted files, relative to $stagingPath */
  protected function unpackRootlevelZipArchive(string $stagingPath, string $fileName): array {
    $extractionFolder = "{$fileName}_Extract";
    $extractionPath = "$stagingPath/$extractionFolder";

    if (!mkdir($extractionPath)) {
      throw new Exception("Could not create directory for extracted files: `$extractionPath`");
    }

    ZIP::extract(file_get_contents("$stagingPath/$fileName"), $extractionPath);

    return Folder::getContentsFlat($extractionPath, $extractionFolder);
  }

  public function getFileById(string $type, string $fileId): FileData {
    if ($file = $this->workspaceDAO->getFileById($fileId, $type)) {
      if ($file->isValid()) {
        return $file;
      }
    }

    throw new HttpError("No $type with id `$fileId` found on workspace `$this->workspaceId`!", 404);
  }

  /** Like getFileById(), but with the file's content. */
  public function loadFileById(string $type, string $fileId): File {
    return $this->loadFile($this->getFileById($type, $fileId));
  }

  public function loadFile(FileData $file): File {
    return File::fromData($file, Storage::getDriver()->get($file->getPath()));
  }

  /** @param FileInfo $info the file's size and modification time, e.g. from a listing of its directory */
  public static function loadAndValidateFile(StoragePath $path, string $type, FileInfo $info): File {
    return File::fromStorage($path, $info, Storage::getDriver()->get($path), $type);
  }

  public function getFileByName(string $type, string $fileName): File {
    $path = $this->storageDirectory->createSubdirectory($type)->createFilePath($fileName);
    $info = Storage::getDriver()->getFileInfo($path);
    $file = $info ? self::loadAndValidateFile($path, $type, $info) : null;

    if ($file?->isValid()) {
      return $file;
    }

    throw new HttpError("No $type with name `$fileName` found on workspace `$this->workspaceId`!", 404);
  }

  public function countFilesOfAllSubFolders(): array {
    $result = [];

    foreach ($this::subFolders as $type) {
      $result[$type] = $this->countFiles($type);
    }

    return $result;
  }

  public function countFiles(string $type): int {
    return count($this->listFilesOfType($type));
  }

  /**
   * The files a rescan reads: those directly in the type's directory whose names fit the type.
   *
   * @return array<string, FileInfo>
   */
  public function listFilesOfType(string $type): array {
    $pattern = ($type == 'Resource') ? "*.*" : "*.[xX][mM][lL]";
    return array_filter(
      Storage::getDriver()->listFiles($this->storageDirectory->createSubdirectory($type)),
      fn(string $fileName): bool => fnmatch($pattern, $fileName),
      ARRAY_FILTER_USE_KEY
    );
  }

  public function delete(): void {
    Storage::getDriver()->deleteDirectory($this->storageDirectory);
  }

  /**
   * Reads the workspace folder and brings the database in line with it.
   *
   * @return array{
   *   valid: array<string, int>,
   *   invalid: int,
   *   logins: array{added: int, deleted: int},
   *   reports: array<string, string[]>,
   *   pruning_skipped: bool
   * }
   */
  // TODO unit-test
  public function storeAllFiles(): array {
    $workspaceCache = new WorkspaceCache($this);
    $workspaceCache->loadFiles();

    // One transaction for the whole workspace: left to itself `storeFile` commits per file, and every commit
    // is a disk flush. It also makes the pass atomic.
    return $this->workspaceDAO->transactional(
      fn(): array => $this->storeAllFilesInTransaction($workspaceCache)
    );
  }

  /**
   * @return array{
   *   valid: array<string, int>,
   *   invalid: int,
   *   logins: array{added: int, deleted: int},
   *   reports: array<string, string[]>,
   *   pruning_skipped: bool
   * }
   */
  private function storeAllFilesInTransaction(WorkspaceCache $workspaceCache): array {
    $typeStats = array_fill_keys(Workspace::subFolders, 0);
    $loginStats = [
      'added' => 0
    ];
    $invalidCount = 0;

    $pruningSkipped = $this->isSuspectedIncompleteRestore($workspaceCache);
    $loginStats['deleted'] = $pruningSkipped ? 0 : $this->removeVanishedFilesFromDB($workspaceCache);

    $workspaceCache->validate();

    $reports = [];

    /** @var File $file */
    foreach ($workspaceCache->getFiles(true) as $file) {
      if (!$file->isValid()) {
        $invalidCount++;
        $reports[$file->getType() . '/' . $file->getId()] = $file->getValidationReport()['error'];
      }

      $this->workspaceDAO->storeFile($file);
      $typeStats[$file->getType()] += 1;
    }

    foreach ($workspaceCache->getFiles(true) as $file) {
      $stats = $this->storeFileMeta($file, $workspaceCache);

      $loginStats['deleted'] += $stats['logins_deleted'];
      $loginStats['added'] += $stats['logins_added'];
    }

    $this->workspaceDAO->updateContentTypeBasedOnRemainingTesttakers();

    return [
      'valid' => $typeStats,
      'invalid' => $invalidCount,
      'logins' => $loginStats,
      'reports' => $reports,
      'pruning_skipped' => $pruningSkipped
    ];
  }

  // An empty workspace folder next to a database that still knows files for it is almost always a lost data volume or
  // a restore that only got as far as the database - not somebody deleting all content at once. Pruning would then
  // delete the file rows and the logins derived from the Testtakers XML, which only the backup still holds.
  // The check is deliberately narrow: emptying a workspace by hand still prunes as soon as one file remains.
  private function isSuspectedIncompleteRestore(WorkspaceCache $workspaceCache): bool {
    if (count($workspaceCache->getFiles(true))) {
      return false;
    }

    foreach ($this->workspaceDAO->getAllFiles() as $fileSet) {
      if (count($fileSet)) {
        return true;
      }
    }

    return false;
  }

  private function removeVanishedFilesFromDB(WorkspaceCache $workspaceCache): int {
    $filesInDb = $this->workspaceDAO->getAllFiles();
    $filesInFolder = $workspaceCache->getFiles(true);
    $deletedLogins = 0;

    foreach ($filesInDb as $fileSet) {
      foreach ($fileSet as $file) {

        if (!isset($filesInFolder[(string) $file->getPath()])) {
          $this->workspaceDAO->deleteFile($file);
          if ($file->getType() === 'Testtakers') {
            $deletedLogins += $this->workspaceDAO->deleteLoginSource($file->getName());
            $this->workspaceDAO->deleteAssetAssignmentSource($file->getName());
          }
        }
      }
    }

    return $deletedLogins;
  }

  // TODO unit-test
  private function storeFileMeta(File $file, ?WorkspaceCache $workspaceCache = null): array {
    $stats = [
      'logins_deleted' => 0,
      'logins_added' => 0
    ];

    if (!$file->isValid()) {
      return $stats;
    }

    if ($file::canBeRelationSubject) {
      $this->workspaceDAO->storeRelations($file);
    }

    if (is_a($file, XMLFileTesttakers::class)) {
      list($deleted, $added) = $this->workspaceDAO->updateLoginSource($file->getName(), $file->getAllLogins());
      $stats['logins_deleted'] = $deleted;
      $stats['logins_added'] = $added;

      $this->workspaceDAO->updateAssetAssignmentSource($file->getName(), $file->getAssetAssignments());
    }

    if (is_a($file, ResourceFile::class) and ResourceFile::isPackage($file->getName())) {
      $file->installPackage();
    }

    if (is_a($file, XMLFileBooklet::class)) {
      $this->workspaceDAO->updateUnitDefsAttachments(
        $file->getId(),
        $this->getRequestedAttachments($file, $workspaceCache)
      );
    }

    return $stats;
  }

  /**
   * Units the cache holds with their content are taken from there; all others are found in the database and loaded
   * from storage.
   */
  public function getRequestedAttachments(XMLFileBooklet $booklet, ?WorkspaceCache $workspaceCache = null): array {
    if (!$booklet->isValid()) {
      return [];
    }

    $requestedAttachments = [];
    foreach ($booklet->getUnitIds() as $unitId) {
      $unit = $workspaceCache?->getUnit($unitId) ?? $this->getFileById('Unit', $unitId);
      /** @var XMLFileUnit $unit */
      $unit = $unit instanceof File ? $unit : $this->loadFile($unit);
      $requestedAttachments = array_merge($requestedAttachments, $unit->getRequestedAttachments());
    }
    return $requestedAttachments;
  }

  public function getFileRelations(FileData $file): array {
    return $this->workspaceDAO->getFileRelations($file->getName(), $file->getType());
  }

  /** checks files that are depending on the current file, upstream */
  private function updateDependentFiles(File $file): void {
    $relatingFiles = $this->workspaceDAO->getDependentFilesByTypes($file, ['Booklet']);

    foreach ($relatingFiles as $fileset) {
      foreach ($fileset as $bookletData) {
        /** @var XMLFileBooklet $booklet */
        $booklet = $this->loadFile($bookletData);
        $this->workspaceDAO->updateUnitDefsAttachments($booklet->getId(), $this->getRequestedAttachments($booklet));
      }
    }

  }

  /**
   * Temporary: neither units nor booklets name a widget by id and version yet, so widgets are found by model alone.
   * A test therefore gets one widget per model of its workspace, and the workspace may hold only one widget per model
   * (see WorkspaceCache::rejectSecondWidgetsForAModel).
   * @return array<string, array{path: string, label: string}> model => widget
   */
  public function getWidgets(): array {
    $widgets = $this->workspaceDAO->getWidgets();
    foreach ($widgets as $widget) {
      CacheService::storeFile(StoragePath::fromString($this->storageDirectory . $widget['path']));
    }
    return $widgets;
  }

  public function getBookletResourcePaths(string $bookletId): array {
    $resourceList = $this->workspaceDAO->getBookletResourcePaths($bookletId);
    $resourceListStructured = [];
    foreach ($resourceList as $item) {
      $resourceListStructured[$item['id']][$item['relationship_type']][] = "{$item['type']}/{$item['name']}";
      CacheService::storeFile($this->storageDirectory->createSubdirectory($item['type'])->createFilePath($item['name']));
    }
    return $resourceListStructured;
  }

  /** Changes whenever a file the rescan reads is added, removed or modified – and only then. */
  public function getWorkspaceHash(): string {
    $files = [];
    foreach (self::subFolders as $type) {
      foreach ($this->listFilesOfType($type) as $fileName => $fileInfo) {
        $files[] = ["$type/$fileName", $fileInfo->size, $fileInfo->modificationTime];
      }
    }
    return hash('XXH3', serialize($files));
  }

  public function setWorkspaceHash(): void {
    $this->workspaceDAO->setWorkspaceHash($this->getWorkspaceHash());
  }

  private function loadFilesIntoCache(WorkspaceCache $workspaceCache, FileType $type): void {
    foreach (FileType::getDependenciesOfType($type) as $dependingType) {
      $files = $this->workspaceDAO->getAllFilesWhere(['type' => $dependingType]);
      foreach ($files[$dependingType] ?? [] as $file) {
        $workspaceCache->addFile($dependingType, $file);
      }
    }
  }
}

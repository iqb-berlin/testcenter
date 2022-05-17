<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class Workspace {

    protected int $workspaceId = 0;
    protected string $workspacePath = '';
    public WorkspaceDAO $workspaceDAO;

    // dont' change order, it's the order of possible dependencies
    const subFolders = ['Resource', 'Unit', 'Booklet', 'Testtakers', 'SysCheck'];


    static function getAll(): array {

        $workspaces = [];
        $class = get_called_class();

        foreach (Folder::glob(DATA_DIR, 'ws_*') as $workspaceDir) {

            $workspaceFolderNameParts = explode('_', $workspaceDir);
            $workspaceId = (int) array_pop($workspaceFolderNameParts);
            $workspaces[$workspaceId] = new $class($workspaceId);
        }

        return $workspaces;
    }


    function __construct(int $workspaceId) {

        $this->workspaceId = $workspaceId;
        $this->workspacePath = $this->getOrCreateWorkspacePath();
        $this->workspaceDAO = new WorkspaceDAO();
    }


    protected function getOrCreateWorkspacePath(): string {

        $workspacePath = DATA_DIR . '/ws_' .  $this->workspaceId;
        if (file_exists($workspacePath) and !is_dir($workspacePath)) {
            throw new Exception("Workspace dir $this->workspaceId seems not to be a proper directory!");
        }
        if (!file_exists($workspacePath)) {
            if (!mkdir($workspacePath)) {
                throw new Exception("Could not create workspace dir $this->workspaceId");
            }
        }
        return $workspacePath;
    }


    public function getOrCreateSubFolderPath(string $type): string {

        $subFolderPath = $this->workspacePath . '/' . $type;
        if (!in_array($type, $this::subFolders)) {
            throw new Exception("Invalid type $type!");
        }
        if (file_exists($subFolderPath) and !is_dir($subFolderPath)) {
            throw new Exception("Workspace dir `$subFolderPath` seems not to be a proper directory!");
        }
        if (!file_exists($subFolderPath)) {
            if (!mkdir($subFolderPath)) {
                throw new Exception("Could not create workspace dir `$subFolderPath`");
            }
        }
        return $subFolderPath;
    }


    public function getId(): int {

        return $this->workspaceId;
    }


    public function getWorkspacePath(): string {

        return $this->workspacePath;
    }


    public function getFiles(): array {

        $files = [];

        foreach ($this::subFolders as $type) {

            $pattern = ($type == 'Resource') ? "*.*" : "*.[xX][mM][lL]";
            $filePaths = Folder::glob($this->getOrCreateSubFolderPath($type), $pattern);

            foreach ($filePaths as $filePath) {

                if (!is_file($filePath)) {
                    continue;
                }

                $files[] = new File($filePath, $type);
            }
        }

        return $files;
    }


    public function deleteFiles(array $filesToDelete): array {

        $report = [
            'deleted' => [],
            'did_not_exist' => [],
            'not_allowed' => [],
            'was_used' => []
        ];

        $validator = new WorkspaceValidator($this);
        $validator->validate();
        $allFiles = $validator->getFiles();

        foreach($filesToDelete as $fileToDelete) {

            $fileToDeletePath = $this->workspacePath . '/' . $fileToDelete;

            if (!file_exists($fileToDeletePath)) {

                $report['did_not_exist'][] = $fileToDelete;
                continue;
            }

            // file does not exist in validator means it must be something not validatable like sysCheck-Reports
            $validatedFile = $allFiles[$fileToDeletePath] ?? null;

            if ($validatedFile and !$this->isUnusedFileAndCanBeDeleted($validatedFile, $filesToDelete)) {

                $report['was_used'][] = $fileToDelete;
                continue;
            }

            if ($validatedFile and $this->postProcessFileDeletion($validatedFile)) {

                $report['error'][] = $fileToDelete;
            }

            if ($this->isPathLegal($fileToDeletePath) and unlink($fileToDeletePath)) {

                $report['deleted'][] = $fileToDelete;

            } else {

                $report['not_allowed'][] = $fileToDelete;
            }
        }

        return $report;
    }


    private function postProcessFileDeletion(?File $file): bool {

        try {

            if ($file->getType() == 'Testtakers') {

                $this->workspaceDAO->deleteLoginSource($this->workspaceId, $file->getName());
            }

            if (($file->getType() == 'Resource') and (/* @var ResourceFile $file */ $file->isPackage())) {

                $file->uninstallPackage();
            }

            $this->workspaceDAO->deleteFileMeta($this->workspaceId, $file->getName());

        } catch (Exception $e) {

            return false;
        }
        return true;
    }


    private function isUnusedFileAndCanBeDeleted(File $file, array $allFilesToDelete): bool {

        if (!$file->isUsed()) {

            return true;
        }

        $usingFiles = array_keys($file->getUsedBy());

        return count(array_intersect($usingFiles, $allFilesToDelete)) === count($usingFiles);
    }



    protected function isPathLegal(string $path): bool {

        return substr_count($path, '..') == 0;
    }


    // takes a file from the workspace-dir toplevel and puts it to the correct subdir if valid
    public function importUnsortedFile(string $fileName): array {

        if (FileExt::has($fileName, 'ZIP') and !FileExt::has($fileName, 'ITCR.ZIP')) {

            $relativeFilePaths = $this->unpackUnsortedZipArchive($fileName);
            $toDelete = [$fileName, $this->getExtractionDirName($fileName)];

        } else {

            $relativeFilePaths = [$fileName];
            $toDelete = $relativeFilePaths;
        }

        $files = $this->sortValidUnsortedFiles($relativeFilePaths);
        $this->deleteUnsorted($toDelete);

        return $files;
    }


    protected function sortValidUnsortedFiles(array $relativeFilePaths): array {

        $files = $this->crossValidateUnsortedFiles($relativeFilePaths);
        $filesAfterSorting = [];

        foreach ($files as $localFilePath => $file) {

            if ($file->isValid()) {

                $this->sortUnsortedFile($localFilePath, $file);
            }

            $this->storeFileMeta($file);

            $filesAfterSorting[$localFilePath] = $file;
        }

        return $filesAfterSorting;
    }


    protected function crossValidateUnsortedFiles(array $localFilePaths): array {

        $files = [];

        $validator = new WorkspaceValidator($this);

        foreach ($localFilePaths as $localFilePath) {

            $file = File::get($this->workspacePath . '/' . $localFilePath, null, true);
            $validator->addFile($file->getType(), $file, true);
            $files[$localFilePath] = $file;
        }

        $validator->validate();

        return $files;
    }


    protected function sortUnsortedFile(string $localFilePath, File $file): void {

        $targetFolder = $this->workspacePath . '/' . $file->getType();

        if (!file_exists($targetFolder)) {
            if (!mkdir($targetFolder)) {

                $file->report('error', "Could not create folder: `$targetFolder`.");
                return;
            }
        }

        $targetFilePath = $targetFolder . '/' . basename($localFilePath);

        if (file_exists($targetFilePath)) {
            $oldFile = File::get($targetFilePath);

            if ($oldFile->getId() !== $file->getId()) {

                $file->report('error', "File of name `{$oldFile->getName()}` did already exist.
                    Overwriting was rejected since new file's ID (`{$file->getId()}`) 
                    differs from old one (`{$oldFile->getId()}`)."
                );
                return;
            }

            if (!unlink($targetFilePath)) {

                $file->report('error', "Could not delete file: `$targetFolder/$localFilePath`");
                return;
            }

            $file->report('warning', "File of name `{$oldFile->getName()}` did already exist and was overwritten.");
        }

        if (!rename($this->workspacePath . '/' . $localFilePath, $targetFilePath)) {

            $file->report('error', "Could not move file to `$targetFolder/$localFilePath`");
            return;
        }

        $file->setFilePath($targetFilePath);
    }


    protected function unpackUnsortedZipArchive(string $fileName): array {

        $filePath = "$this->workspacePath/$fileName";
        $extractionFolder = $this->getExtractionDirName($fileName);
        $extractionPath = "$this->workspacePath/$extractionFolder";

        // sometimes in error cases there are remains from previous attempts
        if (file_exists($extractionPath) and is_dir($extractionPath)) {
            Folder::deleteContentsRecursive($extractionPath);
            rmdir($extractionPath);
        }

        if (!mkdir($extractionPath)) {
            throw new Exception("Could not create directory for extracted files: `$extractionPath`");
        }

        ZIP::extract($filePath, $extractionPath);

        return Folder::getContentsFlat($extractionPath, $extractionFolder);
    }


    protected function getExtractionDirName(string $fileName): string {

        return "{$fileName}_Extract";
    }


    protected function deleteUnsorted(array $relativePaths): void {

        foreach ($relativePaths as $relativePath) {

            $filePath = "$this->workspacePath/$relativePath";
            if (is_dir($filePath)) {
                Folder::deleteContentsRecursive($filePath);
                rmdir($filePath);
            }
            if (is_file($filePath)) {
                unlink($filePath);
            }
        }
    }


    public function getResource(string $findId, bool $allowSimilarVersion = false): File {

        $dirToSearch = $this->getOrCreateSubFolderPath('Resource');

        if (file_exists("$dirToSearch/$findId")) {

            return File::get("$dirToSearch/$findId", 'Resource');
        }
        return $this->findFileById('Resource', $findId, $allowSimilarVersion);
    }


    // TODO fetch from DB instead of searching
    public function findFileById(string $type, string $findId, bool $allowSimilarVersion = false): File {

        $dirToSearch = $this->getOrCreateSubFolderPath($type);
        $bestMatch = null;
        $version = Version::guessFromFileName($findId)['full'];

        if (file_exists("$dirToSearch/$findId")) {

            File::get("$dirToSearch/$findId", $type);
        }

        foreach (Folder::glob($dirToSearch, "*.*", true) as $fullFilePath) {

            $file = File::get($fullFilePath, $type);

            $compareId = FileName::normalize($file->getId(), false);

            if ($file->isValid() && ($compareId == FileName::normalize($findId, false))) {
                return $file;
            }

            if ($allowSimilarVersion and !$bestMatch) {

                $compareIdMajor = FileName::normalize($file->getId(), true);

                if ($file->isValid() && ($compareIdMajor == FileName::normalize($findId, true))) {

                    $compareVersion = Version::guessFromFileName($file->getId())['full'];

                    if (Version::isCompatible($version, $compareVersion)) {

                        $bestMatch = $file;
                    }
                }
            }
        }

        if ($bestMatch) {
            return $bestMatch;
        }

        throw new HttpError("No $type with name `$findId` found on Workspace`$this->workspaceId`!", 404);
    }


    public function countFilesOfAllSubFolders(): array {

        $result = [];

        foreach ($this::subFolders as $type) {

            $result[$type] = $this->countFiles($type);
        }

        return $result;
    }


    public function countFiles(string $type): int {

        $pattern = ($type == 'Resource') ? "*.*" : "*.[xX][mM][lL]";
        return count(Folder::glob($this->getOrCreateSubFolderPath($type), $pattern));
    }


    public function delete(): void {

        Folder::deleteContentsRecursive($this->workspacePath);
        rmdir($this->workspacePath);
    }


    public function storeAllFilesMeta(): array {

        $validator = new WorkspaceValidator($this);
        $typeStats = array_fill_keys(Workspace::subFolders, 0);
        $loginStats = [
            'deleted' => 0,
            'added' => 0
        ];
        $invalidCount = 0;

        foreach ($validator->getFiles() as $file /* @var $file File */) {

            $file->crossValidate($validator);

            if (!$file->isValid()) {

                $invalidCount++;
                continue;
            }

            $stats = $this->storeFileMeta($file);
            $loginStats['deleted'] += $stats['logins_deleted'];
            $loginStats['added'] += $stats['logins_added'];

            $typeStats[$file->getType()] += 1;
        }

        return [
            'valid' => $typeStats,
            'invalid' => $invalidCount,
            'logins' => $loginStats
        ];
    }


    public function storeFileMeta(File $file): ?array {

        $stats = [
            'logins_deleted' => 0,
            'logins_added' => 0
        ];

        if (!$file->isValid()) {

            return null;
        }

        if ($file->getType() == 'Testtakers') {

            /* @var $file XMLFileTesttakers */
            list($deleted, $added) = $this->workspaceDAO->updateLoginSource($this->getId(), $file->getName(), $file->getAllLogins());
            $stats['logins_deleted'] = $deleted;
            $stats['logins_added'] = $added;
        }

        if (($file->getType() == 'Resource') and (/* @var ResourceFile $file */ $file->isPackage())) {

            $file->installPackage();
        }

        $this->workspaceDAO->storeFileMeta($this->getId(), $file);

        return $stats;
    }

    public function getPackageFilePath($packageName, $resourceName): string {

        $path = $this->getWorkspacePath() . "/Resource/$packageName/$resourceName";
        if (!file_exists($path)) {
            throw new HttpError("File of package `$packageName` not found: `$resourceName` ($path)");
        }
        return $path;
    }
}

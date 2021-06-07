<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class Workspace {

    protected int $workspaceId = 0;
    protected string $workspacePath = '';

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

                $files[] = new File($filePath, $type);
            }
        }

        return $files;
    }

    /**
     * @param $filesToDelete - array containing file paths local relative to this workspace
     * @return array
     */
    public function deleteFiles(array $filesToDelete): array {

        $report = [
            'deleted' => [],
            'did_not_exist' => [],
            'not_allowed' => [],
            'was_used' => []
        ];

        $validator = new WorkspaceValidator($this->workspaceId);
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

            if (!$this->isUnusedFileAndCanBeDeleted($validatedFile, $filesToDelete)) {

                $report['was_used'][] = $fileToDelete;
                continue;
            }

            if ($this->isPathLegal($fileToDeletePath) and unlink($fileToDeletePath)) {

                $report['deleted'][] = $fileToDelete;

            } else {

                $report['not_allowed'][] = $fileToDelete;
            }
        }

        return $report;
    }


    private function isUnusedFileAndCanBeDeleted(?File $file, array $allFilesToDelete): bool {

        if ($file === null) {

            return true;
        }

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

        if (strtoupper(substr($fileName, -4)) == '.ZIP') {

            $fileNames = $this->unpackUnsortedZipArchive($fileName);

        } else {

            $fileNames = [$fileName];
        }

        $files = $this->sortValidUnsortedFiles($fileNames);
        $this->deleteUnsortedFiles();

        return $files;
    }


    protected function sortValidUnsortedFiles(array $localFilePaths): array {

        $files = $this->crossValidateUnsortedFiles($localFilePaths);

        foreach ($files as $localFilePath => $file) {

            if ($file->isValid()) {

                $this->sortUnsortedFile($localFilePath, $file);
            }

            $files[$localFilePath] = $file->getValidationReportSorted();
        }

        return $files;
    }


    protected function crossValidateUnsortedFiles(array $localFilePaths): array {

        $files = [];

        $validator = new WorkspaceValidator($this->getId());

        foreach ($localFilePaths as $localFilePath) {

            $file = File::get($this->workspacePath . '/' . $localFilePath, null, true);
            $validator->addFile($file->getType(), $file);
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

        $extractionFolder = "{$fileName}_Extract";
        $filePath = "$this->workspacePath/$fileName";
        $extractionPath = "$this->workspacePath/$extractionFolder";

        if (!mkdir($extractionPath)) {
            throw new Exception("Could not create directory for extracted files: `$extractionPath`");
        }

        ZIP::extract($filePath, $extractionPath);

        return Folder::getContentsFlat($extractionPath, $extractionFolder);
    }


    protected function deleteUnsortedFiles(): void {

        foreach (Folder::glob($this->getWorkspacePath(), "*") as $fullFilePath) {

            if (!in_array(basename($fullFilePath), $this::subFolders)) {

                if (is_dir($fullFilePath)) {

                    Folder::deleteContentsRecursive($fullFilePath);
                    rmdir($fullFilePath);

                } else if (is_file($fullFilePath)) {

                    unlink($fullFilePath);
                }
            }
        }
    }


    public function findFileById(string $type, string $findId, bool $skipSubVersions = false): File {

        $dirToSearch = $this->getOrCreateSubFolderPath($type);
        $findId = FileName::normalize($findId, $skipSubVersions);

        foreach (Folder::glob($dirToSearch, "*.*") as $fullFilePath) {

            $file = File::get($fullFilePath, $type);

            $compareId = $skipSubVersions ? FileName::normalize($file->getId(), $skipSubVersions) : $file->getId();

            if ($file->isValid() && ($compareId == $findId)) {
                return $file;
            }
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
}

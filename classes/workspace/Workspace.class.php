<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class Workspace {

    protected $_workspaceId = 0;
    protected $_workspacePath = '';
    protected $_dataPath = '';

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

        $this->_workspaceId = $workspaceId;

        $this->_dataPath = DATA_DIR;

        $this->_workspacePath = $this->getOrCreateWorkspacePath();
    }


    protected function getOrCreateWorkspacePath(): string {

        $workspacePath = $this->_dataPath . '/ws_' .  $this->_workspaceId;
        if (file_exists($workspacePath) and !is_dir($workspacePath)) {
            throw new Exception("Workspace dir {$this->_workspaceId} seems not to be a proper directory!");
        }
        if (!file_exists($workspacePath)) {
            if (!mkdir($workspacePath)) {
                throw new Exception("Could not create workspace dir {$this->_workspaceId}");
            }
        }
        return $workspacePath;
    }


    protected function getOrCreateSubFolderPath(string $type): string {

        $subFolderPath = $this->_workspacePath . '/' . $type;
        if (!in_array($type, $this::subFolders)) {
            throw new Exception("Invalid type {$type}!");
        }
        if (file_exists($subFolderPath) and !is_dir($subFolderPath)) {
            throw new Exception("Workspace dir `{$subFolderPath}` seems not to be a proper directory!");
        }
        if (!file_exists($subFolderPath)) {
            if (!mkdir($subFolderPath)) {
                throw new Exception("Could not create workspace dir `$subFolderPath`");
            }
        }
        return $subFolderPath;
    }


    public function getId(): int {

        return $this->_workspaceId;
    }


    public function getWorkspaceId(): int { // TODO remove duplicate function

        return $this->_workspaceId;
    }


    public function getWorkspacePath(): string {

        return $this->_workspacePath;
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
            'not_allowed' => []
        ];
        foreach($filesToDelete as $fileToDelete) {
            $fileToDeletePath = $this->_workspacePath . '/' . $fileToDelete;
            if (!file_exists($fileToDeletePath)) {
                $report['did_not_exist'][] = $fileToDelete;
            } else if ($this->isPathLegal($fileToDeletePath) and unlink($fileToDeletePath)) {
                $report['deleted'][] = $fileToDelete;
            } else {
                $report['not_allowed'][] = $fileToDelete;
            }
        }
        return $report;
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

        return $this->importUnsortedFiles($fileNames);
    }


    protected function importUnsortedFiles(array $localFilePaths): array {

        $files = $this->validateUnsortedFiles($localFilePaths);

        foreach ($files as $localFilePath => $file) {

            if ($file->isValid()) {

                $this->sortUnsortedFile($localFilePath, $file);
            }

            $files[$localFilePath] = $file->getValidationReportSorted();
        }

        return $files;
    }


    protected function validateUnsortedFiles(array $localFilePaths): array {

        $files = [];

        $validator = new WorkspaceValidator($this->getWorkspaceId());

        foreach ($localFilePaths as $localFilePath) {

            $file = File::get($this->_workspacePath . '/' . $localFilePath, null, true);
            $validator->addFile($file->getType(), $file);
            $files[$localFilePath] = $file;
        }

        $validator->validate();

        return $files;
    }


    protected function sortUnsortedFile(string $localFilePath, File $file): void {

        $targetFolder = $this->_workspacePath . '/' . $file->getType();

        if (!file_exists($targetFolder)) {
            if (!mkdir($targetFolder)) {

                $file->report('error', "Could not create folder: `$targetFolder`.");
                unlink($file->getPath());
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
                unlink($file->getPath());
                return;
            }

            if (!unlink($targetFilePath)) {

                $file->report('error', "Could not delete file: `$targetFolder/$localFilePath`");
                unlink($file->getPath());
                return;
            }

            $file->report('warning', "File of name `{$oldFile->getName()}` did already exist and was overwritten.");
        }

        if (!rename($this->_workspacePath . '/' . $localFilePath, $targetFilePath)) {

            $file->report('error', "Could not move file to `$targetFolder/$localFilePath`");
            unlink($file->getPath());
            return;
        }

        $file->setFilePath($targetFilePath);
    }


    protected function unpackUnsortedZipArchive(string $fileName): array {

        $extractionFolder = "{$fileName}_Extract";
        $filePath = "{$this->_workspacePath}/$fileName";
        $extractionPath = "{$this->_workspacePath}/$extractionFolder";

        if (!mkdir($extractionPath)) {
            throw new Exception("Could not create directory for extracted files: `$extractionPath`");
        }

        ZIP::extract($filePath, $extractionPath);

        // TODO handle subfolders!
        $fileList = array_map(
            function(string $fileName) use ($extractionFolder) { return "$extractionFolder/$fileName"; },
            Folder::getContentsRecursive($extractionPath)
        );

        return  $fileList;

        // Folder::deleteContentsRecursive($extractionPath); TODO Where?
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

        throw new HttpError("No $type with name `$findId` found on Workspace`{$this->_workspaceId}`!", 404);
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

        Folder::deleteContentsRecursive($this->_workspacePath);
        rmdir($this->_workspacePath);
    }
}

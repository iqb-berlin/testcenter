<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class Workspace {

    protected $_workspaceId = 0;
    protected $_workspacePath = '';
    protected $_dataPath = '';

    const subFolders = ['Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource'];


    static function getAll(): array {

        $workspaceControllers = [];
        $class = get_called_class();

        foreach (Folder::glob(DATA_DIR, 'ws_*') as $workspaceDir) {

            $workspaceFolderNameParts = explode('_', $workspaceDir);
            $workspaceId = (int) array_pop($workspaceFolderNameParts);
            $workspaceControllers[$workspaceId] = new $class($workspaceId);
        }

        return $workspaceControllers;
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


    public function getWorkspacePath() {

        return $this->_workspacePath;
    }


    public function getWorkspaceId() {

        return $this->_workspaceId;
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


    /**
     * takes a file from the workspace-dir toplevel and puts it to the correct subdir
     *
     * @param $fileName
     * @return array - keys: imported files; value true or error message
     * @throws Exception
     */
    public function importUnsortedFile(string $fileName): array {

        if (strtoupper(substr($fileName, -4)) == '.ZIP') {
            return $this->importUnsortedZipArchive($fileName);
        }

        $uploadedFile = $this->sortAndValidateUnsortedFile($fileName);
        unlink($uploadedFile->getPath());

        return [
            $fileName => $uploadedFile->getValidationReportSorted()
        ];
    }


    protected function sortAndValidateUnsortedFile(string $fileName): File {

        $file = File::get($this->_workspacePath . '/' . $fileName, null, true);

        $file->crossValidate(new WorkspaceValidator($this->getWorkspaceId())); // TODO merge (or separate completely) Workspace and Validator maybe and get rid of this workaround

        if (!$file->isValid()) {
            return $file;
        }

        $targetFolder = $this->_workspacePath . '/' . $file->getType();

        // move file from testcenter-tmp-folder to targetfolder
        if (!file_exists($targetFolder)) {
            if (!mkdir($targetFolder)) {
                $file->report('error', "Could not create folder: `$targetFolder`.");
                return $file;
            }
        }

        $targetFilePath = $targetFolder . '/' . basename($fileName);

        if (file_exists($targetFilePath)) {
            $oldFile = File::get($targetFilePath);

            if ($oldFile->getId() !== $file->getId()) {

                $file->report('error', "File of name `{$oldFile->getName()}` did already exist. 
                    Overwriting was rejected since new file's ID (`{$file->getId()}`) 
                    differs from old one (`{$oldFile->getId()}`)."
                );
                return $file;
            }

            if (!unlink($targetFilePath)) {
                $file->report('error', "Could not delete file: `$targetFolder/$fileName`");
                return $file;
            }

            $file->report('warning', "File of name `{$oldFile->getName()}` did already exist and was overwritten.");
        }

        if (!rename($this->_workspacePath . '/' . $fileName, $targetFilePath)) {
            $file->report('error', "Could not move file to `$targetFolder/$fileName`");
            return $file;
        }

        return $file;
    }


    protected function importUnsortedZipArchive(string $fileName): array {

        $extractedFiles = [];

        $extractionFolder = "{$fileName}_Extract";
        $filePath = "{$this->_workspacePath}/$fileName";
        $extractionPath = "{$this->_workspacePath}/$extractionFolder";

        if (!mkdir($extractionPath)) {
            throw new Exception("Could not create directory for extracted files: `$extractionPath`");
        }

        $zip = new ZipArchive;
        if ($zip->open($filePath) !== TRUE) {
            throw new Exception('Could not extract Zip-File');
        }
        $zip->extractTo($extractionPath . '/');
        $zip->close();

        $zipFolderDir = opendir($extractionPath);
        if ($zipFolderDir !== false) {
            while (($entry = readdir($zipFolderDir)) !== false) {
                if (is_file($extractionPath . '/' .  $entry)) {
                    $file = $this->sortAndValidateUnsortedFile("$extractionFolder/$entry");
                    $extractedFiles["$fileName/$entry"] = $file->getValidationReportSorted();
                }
            }
        }

        $this->emptyAndDeleteFolder($extractionPath);
        unlink($filePath);

        return $extractedFiles;
    }


    protected function emptyAndDeleteFolder($folder) {
        if (file_exists($folder)) {
            $folderDir = opendir($folder);
            if ($folderDir !== false) {
                while (($entry = readdir($folderDir)) !== false) {
                    if (($entry !== '.') && ($entry !== '..')) {
                        $fullname = $folder . '/' .  $entry;
                        if (is_dir($fullname)) {
                            $this->emptyAndDeleteFolder($fullname);
                        } else {
                            unlink($fullname);
                        }
                    }
                }
                rmdir($folder);
            }
        }
    }


    public function findFileById(string $type, string $findId, bool $skipSubVersions = false): File {

        $dirToSearch = $this->getOrCreateSubFolderPath($type);
        $findId = FileName::normalize($findId, $skipSubVersions);

        foreach (Folder::glob($dirToSearch, "*.*") as $fullFilePath) {

            $file = File::get($fullFilePath, $type);
            if ($file->isValid() && ($file->getId() == $findId)) {
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


    private function countFiles(string $type): int {

        $pattern = ($type == 'Resource') ? "*.*" : "*.[xX][mM][lL]";
        return count(Folder::glob($this->getOrCreateSubFolderPath($type), $pattern));
    }
}

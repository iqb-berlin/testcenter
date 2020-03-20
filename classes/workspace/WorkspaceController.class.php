<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class WorkspaceController {

    protected $_workspaceId = 0;
    protected $_workspacePath = '';
    protected $_dataPath = '';

    const subFolders = ['Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource'];


    static function getAll(): array {

        $workspaceControllers = [];
        $class = get_called_class();

        foreach (Folder::glob(DATA_DIR, 'ws_*') as $workspaceDir) {

            $workspaceId = array_pop(explode('_', $workspaceDir));
            $workspaceControllers[$workspaceId] = new $class((int) $workspaceId);
        }

        return $workspaceControllers;
    }


    function __construct(int $workspaceId) {

        $this->_workspaceId = $workspaceId;

        $this->_dataPath = DATA_DIR;

        $this->_workspacePath = $this->_getOrCreateWorkspacePath();
    }


    protected function _getOrCreateWorkspacePath() {

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


    protected function _getOrCreateSubFolderPath(string $type): string {

        $subFolderPath = $this->_workspacePath . '/' . $type;
        if (!in_array($type, $this::subFolders)) {
            throw new Exception("Invalid SubFolder type {$type}!");
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


    public function getAllFiles(): array {

        $fileList = [];

        $workspaceDirHandle = opendir($this->_workspacePath);
        while (($subDir = readdir($workspaceDirHandle)) !== false) {
            if (($subDir === '.') or ($subDir === '..')) {
                continue;
            }

            $fullSubDirPath = $this->_workspacePath . '/' . $subDir;

            if (!is_dir($fullSubDirPath)) {
                continue;
            }

            $subDirHandle = opendir($fullSubDirPath);
            while (($entry = readdir($subDirHandle)) !== false) {
                $fullFilePath = $fullSubDirPath . '/' . $entry;
                if (!is_file($fullFilePath)) {
                    continue;
                }

                $rs = new ResourceFile($fullFilePath, true);

                array_push($fileList, [
                    'filename' => $rs->getFileName(),
                    'filesize' => $rs->getFileSize(),
                    'filesizestr' => $rs->getFileSizeString(), // TODO is this used?
                    'filedatetime' => $rs->getFileDateTime(),
                    'filedatetimestr' => $rs->getFileDateTimeString(), // TODO is this used?
                    'type' => $subDir,
                    'typelabel' => $subDir // TODO is this used?
                ]);

            }

        }

        return $fileList;
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
            } else if ($this->_isPathLegal($fileToDeletePath) and unlink($fileToDeletePath)) {
                $report['deleted'][] = $fileToDelete;
            } else {
                $report['not_allowed'][] = $fileToDelete;
            }
        }
        return $report;
    }


    protected function _isPathLegal(string $path): bool {

        return substr_count($path, '..') == 0;
    }


    /**
     * takes a file from the workspcae-dir toplevel and puts it to the correct subdir
     *
     *
     * @param $fileName
     * @return array - keys: imported files; value true or error message
     * @throws Exception
     */
    public function importUnsortedResource($fileName) {

        if (strtoupper(substr($fileName, -4)) == '.ZIP') {
            return $this->_importUnsortedZipArchive($fileName);
        }

        $this->_sortAndValidateUnsortedResource($fileName);

        return [
            $fileName => true
        ];
    }


    protected function _sortAndValidateUnsortedResource($fileName) {

        $targetFolder = $this->_workspacePath . '/Resource';

        if (strtoupper(substr($fileName, -4)) == '.XML') {
            $xFile = new XMLFile($this->_workspacePath . '/' . $fileName, true);
            if ($xFile->isValid()) {
                $targetFolder = $this->_workspacePath . '/' . $xFile->getRoottagName();
            } else {
                throw new HttpError("'$fileName' XML nicht erkannt oder nicht valide: \n" . implode(";\n ", $xFile->getErrors()), 400);
            }
        }

        // move file from testcenter-tmp-folder to targetfolder
        if (!file_exists($targetFolder)) {
            if (!mkdir($targetFolder)) {
                throw new Exception('Konnte Unterverzeichnis nicht anlegen.');
            }
        }

        $targetFilePath = $targetFolder . '/' . basename($fileName);

        if (file_exists($targetFilePath)) {
            if (!unlink($targetFilePath)) {
                throw new Exception('Konnte alte Datei nicht löschen: ' . "$targetFolder/$fileName");
            }
        }

        if (strlen($targetFilePath) > 0) {
            if (!rename($this->_workspacePath . '/' . $fileName, $targetFilePath)) {
                throw new Exception('Konnte Datei nicht in Zielordner verschieben: ' . "$targetFolder/$fileName");
            }
            // TODO remove if https://github.com/iqb-berlin/testcenter-iqb-php/issues/30 is done
            chmod($targetFilePath, 0777);
        }
    }


    protected function _importUnsortedZipArchive($fileName) {

        $extractedFiles = [];

        $extractionFolder = "{$fileName}_Extract";
        $filePath = "{$this->_workspacePath}/$fileName";
        $extractionPath = "{$this->_workspacePath}/$extractionFolder";

        if (!mkdir($extractionPath)) {
            throw new Exception('Konnte Verzeichnis für ZIP-Ziel nicht anlegen: ' . $extractionPath);
        }

        $zip = new ZipArchive;
        if ($zip->open($filePath) !== TRUE) {
            throw new Exception('Konnte ZIP-Datei nicht entpacken.');
        }

        $zip->extractTo($extractionPath . '/');
        $zip->close();

        $zipFolderDir = opendir($extractionPath);
        if ($zipFolderDir !== false) {
            while (($entry = readdir($zipFolderDir)) !== false) {
                if (is_file($extractionPath . '/' .  $entry)) {
                    try { // we don't want to fail if one file fails
                        $this->_sortAndValidateUnsortedResource("$extractionFolder/$entry");
                        $extractedFiles["$extractionFolder/$entry"] = true;
                    } catch (Exception $e) {
                        $extractedFiles["$extractionFolder/$entry"] = $e->getMessage();
                    }
                }
            }
        }

        $this->_emptyAndDeleteFolder($extractionPath);
        unlink($filePath);

        return $extractedFiles;
    }


    protected function _emptyAndDeleteFolder($folder) {
        if (file_exists($folder)) {
            $folderDir = opendir($folder);
            if ($folderDir !== false) {
                while (($entry = readdir($folderDir)) !== false) {
                    if (($entry !== '.') && ($entry !== '..')) {
                        $fullname = $folder . '/' .  $entry;
                        if (is_dir($fullname)) {
                            $this->_emptyAndDeleteFolder($fullname);
                        } else {
                            unlink($fullname);
                        }
                    }
                }
                rmdir($folder);
            }
        }
    }


    public function getXMLFileByName(string $type, string $findName): XMLFile {

        $dirToSearch = $this->_getOrCreateSubFolderPath($type);

        foreach (Folder::glob($dirToSearch, "*.[xX][mM][lL]") as $fullFilePath) {

            $xmlFile = XMLFile::get($fullFilePath);
            if ($xmlFile->isValid()) {
                $itemName = $xmlFile->getId();
                if ($itemName == $findName) {
                    return $xmlFile;
                }
            }
        }

        throw new HttpError("No $type with name `$findName` found on Workspace`{$this->_workspaceId}`!", 404);
    }


    public function getResourceFileByName(string $resourceName, bool $skipSubVersions): ResourceFile {

        $resourceFolder = $this->_getOrCreateSubFolderPath('Resource');

        $resourceFileName = $this->normaliseFileName(basename($resourceName), $skipSubVersions);

        foreach (Folder::glob($resourceFolder, "*.*") as $fullFilePath) {

            $normalizedFilename = $this->normaliseFileName(basename($fullFilePath), $skipSubVersions);

            if ($normalizedFilename == $resourceFileName) {
                return new ResourceFile($fullFilePath);
            }
        }

        throw new HttpError("No resource with name `$resourceName` found!", 404);
    }


    protected function normaliseFileName(string $fileName, bool $skipSubVersions): string {

        $normalizedFilename = strtoupper($fileName);

        if ($skipSubVersions) {
            $firstDotPos = strpos($normalizedFilename, '.');
            if ($firstDotPos) {
                $lastDotPos = strrpos($normalizedFilename, '.');
                if ($lastDotPos > $firstDotPos) {
                    $normalizedFilename = substr($normalizedFilename, 0, $firstDotPos) . substr($normalizedFilename, $lastDotPos);
                }
            }
        }

        return $normalizedFilename;
    }
}

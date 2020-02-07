<?php /** @noinspection PhpUnhandledExceptionInspection */

class WorkspaceController {

    protected $_workspaceId = 0;
    protected $_workspacePath = '';
    protected $_dataPath = '';


    function __construct(int $workspaceId) {

        // TODO check here if ws exists could be found
        $this->_workspaceId = $workspaceId;

        $this->_dataPath = ROOT_DIR . '/vo_data';
        $this->_workspacePath = $this->_createWorkspaceFolderIfNotExistant();
    }


    private function _createWorkspaceFolderIfNotExistant() {

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

    function getWorkspacePath() {

        return $this->_workspacePath;
    }


    function getAllFiles(): array {

        $fileList = array();

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

                $rs = new ResourceFile($entry, filemtime($fullFilePath), filesize($fullFilePath));

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
     * @param $filesToDelete - array containing file names
     * @return array
     */
    function deleteFiles(array $filesToDelete): array {

        $report = array(
            'deleted' => array(),
            'did_not_exist' => array(),
            'not_allowed' => array()
        );
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


    private function _isPathLegal(string $path): bool {

        return substr_count($path, '..') == 0;
    }

    
    function assemblePreparedBookletsFromFiles(): array {

        $testTakerDirPath = $this->_workspacePath . '/Testtakers';
        if (!file_exists($testTakerDirPath)) {
            throw new Exception("Folder not found: $testTakerDirPath");
        }
        $preparedBooklets = [];

        foreach ($this->_globStreamSafe($testTakerDirPath, "*.[xX][mM][lL]") as $fullFilePath) {

            $testTakersFile = new XMLFileTesttakers($fullFilePath);
            if (!$testTakersFile->isValid()) {
                continue;
            }

            if ($testTakersFile->getRoottagName() != 'Testtakers') {
                continue;
            }

            foreach ($testTakersFile->getAllTesttakers() as $prepared) {

                $localGroupName = $prepared['groupname'];
                $localLoginData = $prepared;
                // ['groupname' => string, 'loginname' => string, 'code' => string, 'booklets' => string[]]
                if (!isset($preparedBooklets[$localGroupName])) {
                    $preparedBooklets[$localGroupName] = [];
                }
                array_push($preparedBooklets[$localGroupName], $localLoginData);
            }
        }
        return $this->_sortPreparedBooklets($preparedBooklets);
    }


    private function _globStreamSafe(string $dir, string $filePattern): array {

        $files = scandir($dir);
        $found = [];

        foreach ($files as $filename) {
            if (in_array($filename, ['.', '..'])) {
                continue;
            }

            if (fnmatch($filePattern, $filename)) {
                $found[] = "{$dir}/{$filename}";
            }
        }

        return $found;
    }


    private function _sortPreparedBooklets(array $preparedBooklets): array {

        $preparedBookletsSorted = [];
        // error_log(print_r($preparedBooklets, true));
        // !! no cross checking, so it's not checked whether a prepared booklet is started or a started booklet has been prepared // TODO overthink this
        foreach($preparedBooklets as $group => $preparedData) {
            $alreadyCountedLogins = [];
            foreach($preparedData as $pd) {
                // ['groupname' => string, 'loginname' => string, 'code' => string, 'booklets' => string[]]
                if (!isset($preparedBookletsSorted[$group])) {
                    $preparedBookletsSorted[$group] = [
                        'groupname' => $group,
                        'loginsPrepared' => 0,
                        'personsPrepared' => 0,
                        'bookletsPrepared' => 0,
                        'bookletsStarted' => 0,
                        'bookletsLocked' => 0,
                        'laststart' => strtotime("1/1/2000"),
                        'laststartStr' => ''
                    ];
                }
                if (!in_array($pd['loginname'], $alreadyCountedLogins)) {
                    array_push($alreadyCountedLogins, $pd['loginname']);
                    $preparedBookletsSorted[$group]['loginsPrepared'] += 1;
                }
                $preparedBookletsSorted[$group]['personsPrepared'] += 1;
                $preparedBookletsSorted[$group]['bookletsPrepared'] += count($pd['booklets']);
            }
        }
        return $preparedBookletsSorted;
    }


    function getTestStatusOverview(array $bookletsStarted): array {

        $preparedBooklets = $this->assemblePreparedBookletsFromFiles();

        foreach($bookletsStarted as $startedBooklet) {
            // groupname, loginname, code, bookletname, locked
            if (!isset($preparedBooklets[$startedBooklet['groupname']])) {
                $preparedBooklets[$startedBooklet['groupname']] = [
                    'groupname' => $startedBooklet['groupname'],
                    'loginsPrepared' => 0,
                    'personsPrepared' => 0,
                    'bookletsPrepared' => 0,
                    'bookletsStarted' => 0,
                    'bookletsLocked' => 0,
                    'laststart' => strtotime("1/1/2000"),
                    'laststartStr' => ''
                ];
            }
            $preparedBooklets[$startedBooklet['groupname']]['bookletsStarted'] += 1;
            if ($startedBooklet['locked'] == '1') {
                $preparedBooklets[$startedBooklet['groupname']]['bookletsLocked'] += 1;
            }
            $tmpTime = strtotime($startedBooklet['laststart']);
            if ($tmpTime > $preparedBooklets[$startedBooklet['groupname']]['laststart']) {
                $preparedBooklets[$startedBooklet['groupname']]['laststart'] = $tmpTime;
                $preparedBooklets[$startedBooklet['groupname']]['laststartStr'] = strftime('%d.%m.%Y',$tmpTime);
            }
        }

        // get rid of the key
        $returner = [];
        foreach($preparedBooklets as $group => $groupData) {
            array_push($returner, $groupData);
        }

        return $returner;
    }


    /**
     * takes a file from the workspcae-dir toplevel and puts it to the correct subdir
     *
     *
     * @param $fileName
     * @return array - keys: imported files; value true or error message
     * @throws Exception
     */
    function importUnfiledResource($fileName) {

        if (strtoupper(substr($fileName, -4)) == '.ZIP') {
            return $this->_importUnfiledZipArchive($fileName);
        }

        $this->_fileAndValidateUnfiledResource($fileName);

        return  array(
            $fileName => true
        );
    }

    /**
     * @param $fileName
     * @throws Exception
     */
    private function _fileAndValidateUnfiledResource($fileName) {

        $targetFolder = $this->_workspacePath . '/Resource';

        if (strtoupper(substr($fileName, -4)) == '.XML') {
            $xFile = new XMLFile($this->_workspacePath . '/' . $fileName, true);
            if ($xFile->isValid()) {
                $targetFolder = $this->_workspacePath . '/' . $xFile->getRoottagName();
            } else {
                throw new Exception("e: '$fileName' XML nicht erkannt oder nicht valide: \n" . implode(";\n ", $xFile->getErrors()));
            }
        }

        // move file from testcenter-tmp-folder to targetfolder
        if (!file_exists($targetFolder)) {
            if (!mkdir($targetFolder)) {
                throw new Exception('e:Interner Fehler: Konnte Unterverzeichnis nicht anlegen.');
            }
        }

        $targetFilePath = $targetFolder . '/' . basename($fileName);

        if (file_exists($targetFilePath)) {
            if (!unlink($targetFilePath)) {
                throw new Exception('e:Interner Fehler: Konnte alte Datei nicht löschen: ' . "$targetFolder/$fileName");
            }
        }

        if (strlen($targetFilePath) > 0) {
            if (!rename($this->_workspacePath . '/' . $fileName, $targetFilePath)) {
                throw new Exception('e:Interner Fehler: Konnte Datei nicht in Zielordner verschieben: ' . "$targetFolder/$fileName");
            }
        }
    }

    /**
     * @param $fileName
     * @return array - keys: imported files; value true or error message
     * @throws Exception
     */
    private function _importUnfiledZipArchive($fileName) {

        $extractedFiles = array();

        $extractionFolder = "{$fileName}_Extract";
        $filePath = "{$this->_workspacePath}/$fileName";
        $extractionPath = "{$this->_workspacePath}/$extractionFolder";

        if (!mkdir($extractionPath)) {
            throw new Exception('e:Interner Fehler: Konnte Verzeichnis für ZIP-Ziel nicht anlegen: ' . $extractionPath);
        }

        $zip = new ZipArchive;
        if ($zip->open($filePath) !== TRUE) {
            throw new Exception('e:Interner Fehler: Konnte ZIP-Datei nicht entpacken.');
        }

        $zip->extractTo($extractionPath . '/');
        $zip->close();

        $zipFolderDir = opendir($extractionPath);
        if ($zipFolderDir !== false) {
            while (($entry = readdir($zipFolderDir)) !== false) {
                if (is_file($extractionPath . '/' .  $entry)) {
                    try { // we don't want to fail if one file fails
                        $this->_fileAndValidateUnfiledResource("$extractionFolder/$entry");
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


    private function _emptyAndDeleteFolder($folder) {
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


    function getBookletName(string $bookletId): string {

        $bookletName = '';

        $lookupFolder = $this->_workspacePath . '/Booklet';
        if (!file_exists($lookupFolder)) {
            throw new Exception("Folder does not exists: `$lookupFolder`");
        }

        $lookupDir = opendir($lookupFolder);
        if ($lookupDir === false) {
            throw new Exception("Could not open: `$lookupFolder`");
        }

        while (($entry = readdir($lookupDir)) !== false) {

            $fullFileName = $lookupFolder . '/' . $entry;

            if (is_file($fullFileName) && (strtoupper(substr($entry, -4)) == '.XML')) {

                $xFile = new XMLFile($fullFileName);

                if ($xFile->isValid()) {

                    if ($xFile->getRoottagName()  == 'Booklet') {

                        $myBookletId = $xFile->getId();

                        if ($myBookletId === $bookletId) {

                            $bookletName = $xFile->getLabel();
                            break;
                        }
                    }
                }
            }
        }

        return $bookletName;
    }

}

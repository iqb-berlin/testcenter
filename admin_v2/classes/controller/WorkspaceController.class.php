<?php


class WorkspaceController {

    protected $_workspaceId = 0;
    protected $_workspacePath = '';
    protected $_dataPath = '';
    protected $_dbConnection;

    /**
     * WorkspaceController constructor.
     * @param $workspaceId
     * @throws Exception
     */
    function __construct($workspaceId) {

        // TODO check here if ws exists could be found
        $this->_workspaceId = $workspaceId;

        $this->_dataPath = ROOT_DIR . '/vo_data';
        $this->_workspacePath = $this->_createWorkspaceFolderIfNotExistant();


        $this->_dbConnection = new DBConnectionAdmin();
    }

    /**
     * @throws Exception
     */
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

    /**
     * @return array
     */
    function getAllFiles() {

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
     * @return int
     */
    function deleteFiles($filesToDelete) {

        $deleted = 0;
        foreach($filesToDelete as $fileToDelete) {
            $fileToDeletePath = $this->_workspacePath . '/' . $fileToDelete;
            if (file_exists($fileToDeletePath)
                and (realpath($fileToDeletePath) === $fileToDeletePath) // to avoid hacks like ..::../README.md
                and unlink($fileToDeletePath)) {
                $deleted += 1;
            }
        }
        return $deleted;
    }

    /**
     * TODO find better place for this, maybe in DBconnector?
     *
     * @param $workspaceId
     * @return array
     */
    function getAssembledResults($workspaceId) {

        $keyedReturn = [];

        foreach($this->_dbConnection->getResultsCount($workspaceId) as $resultSet) {
            // groupname, loginname, code, bookletname, num_units
            if (!isset($keyedReturn[$resultSet['groupname']])) {
                $keyedReturn[$resultSet['groupname']] = [
                    'groupname' => $resultSet['groupname'],
                    'bookletsStarted' => 1,
                    'num_units_min' => $resultSet['num_units'],
                    'num_units_max' => $resultSet['num_units'],
                    'num_units_total' => $resultSet['num_units'],
                    'lastchange' => $resultSet['lastchange']
                ];
            } else {
                $keyedReturn[$resultSet['groupname']]['bookletsStarted'] += 1;
                $keyedReturn[$resultSet['groupname']]['num_units_total'] += $resultSet['num_units'];
                if ($resultSet['num_units'] > $keyedReturn[$resultSet['groupname']]['num_units_max']) {
                    $keyedReturn[$resultSet['groupname']]['num_units_max'] = $resultSet['num_units'];
                }
                if ($resultSet['num_units'] < $keyedReturn[$resultSet['groupname']]['num_units_min']) {
                    $keyedReturn[$resultSet['groupname']]['num_units_min'] = $resultSet['num_units'];
                }
                if ($resultSet['lastchange'] > $keyedReturn[$resultSet['groupname']]['lastchange']) {
                    $keyedReturn[$resultSet['groupname']]['lastchange'] = $resultSet['lastchange'];
                }
            }
        }

        $returner = array();

        // get rid of the key and calculate mean
        foreach($keyedReturn as $group => $groupData) {
            $groupData['num_units_mean'] = $groupData['num_units_total'] / $groupData['bookletsStarted'];
            array_push($returner, $groupData);
        }

        return $returner;
    }


    /**
     * @return array
     * @throws Exception
     */
    function assemblePreparedBookletsFromFiles() {

        $testTakerDirPath = $this->_workspacePath . '/Testtakers';
        if (!file_exists($testTakerDirPath)) {
            throw new Exception("Folder not found: $testTakerDirPath");
        }

        $preparedBooklets = [];
        foreach (glob("$testTakerDirPath/*.[xX][mM][lL]") as $fileName) {

            $fullFilePath = $testTakerDirPath . '/' . $fileName;
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
                // error_log($prepared['groupname'] . '/' . $prepared['loginname']);

            }
            unset($prepared);
        }

        $preparedBookletsSorted = [];
        // error_log(print_r($preparedBooklets, true));
        // !! no cross checking, so it's not checked whether a prepared booklet is started or a started booklet has been prepared
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
        } // counting prepared

        return $preparedBookletsSorted;
    }

    /**
     * @return array
     * @throws Exception
     */
    function getTestStatusOverview() {

        $preparedBooklets = $this->assemblePreparedBookletsFromFiles();

        foreach($this->_dbConnection->getBookletsStarted($this->_workspaceId) as $startedBooklets) {
            // groupname, loginname, code, bookletname, locked
            if (!isset($preparedBooklets[$startedBooklets['groupname']])) {
                $preparedBooklets[$startedBooklets['groupname']] = [
                    'groupname' => $startedBooklets['groupname'],
                    'loginsPrepared' => 0,
                    'personsPrepared' => 0,
                    'bookletsPrepared' => 0,
                    'bookletsStarted' => 0,
                    'bookletsLocked' => 0,
                    'laststart' => strtotime("1/1/2000"),
                    'laststartStr' => ''
                ];
            }
            $preparedBooklets[$startedBooklets['groupname']]['bookletsStarted'] += 1;
            if ($startedBooklets['locked'] == '1') {
                $preparedBooklets[$startedBooklets['groupname']]['bookletsLocked'] += 1;
            }
            $tmpTime = strtotime($startedBooklets['laststart']);
            if ($tmpTime > $preparedBooklets[$startedBooklets['groupname']]['laststart']) {
                $preparedBooklets[$startedBooklets['groupname']]['laststart'] = $tmpTime;
                $preparedBooklets[$startedBooklets['groupname']]['laststartStr'] = strftime('%d.%m.%Y',$tmpTime);
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
                            emptyAndDeleteFolder($fullname);
                        } else {
                            unlink($fullname);
                        }
                    }
                }
                rmdir($folder);
            }
        }
    }

}

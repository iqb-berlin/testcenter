<?php


class WorkspaceController {

    private $_workspaceId = 0;
    private $_workspacePath = '';

    function __construct($workspaceId) {

        // TODO check here if ws exists could be found
        $this->_workspaceId = $workspaceId;

        $this->_workspacePath = ROOT_DIR . '/vo_data/ws_' .  $workspaceId;
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

                error_log("PUSH" .  $rs->getFileName());
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

        $dbConnection = new DBConnectionAdmin();
        foreach($dbConnection->getBookletsStarted($this->_workspaceId) as $startedBooklets) {
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
}

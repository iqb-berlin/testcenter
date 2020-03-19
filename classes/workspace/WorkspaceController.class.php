<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class WorkspaceController {

    protected $_workspaceId = 0;
    protected $_workspacePath = '';
    protected $_dataPath = '';

    const subFolders = ['Testtakers', 'SysCheck', 'Booklet', 'Unit', 'Resource'];

    function __construct(int $workspaceId) {

        $this->_workspaceId = $workspaceId;

        $this->_dataPath = DATA_DIR;

        $this->_workspacePath = $this->_getOrCreateWorkspacePath();
    }


    private function _getOrCreateWorkspacePath() {

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


    private function _getOrCreateSubFolderPath(string $type): string {

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


    function getWorkspacePath() {

        return $this->_workspacePath;
    }


    function getAllFiles(): array {

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
    function deleteFiles(array $filesToDelete): array {

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


    private function _isPathLegal(string $path): bool {

        return substr_count($path, '..') == 0;
    }

    
    function assemblePreparedBookletsFromFiles(): array {

        $testTakerDirPath = $this->_workspacePath . '/Testtakers';
        if (!file_exists($testTakerDirPath)) {
            throw new Exception("Folder not found: $testTakerDirPath");
        }
        $preparedBooklets = [];

        foreach (Folder::glob($testTakerDirPath, "*.[xX][mM][lL]") as $fullFilePath) {

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

        return [
            $fileName => true
        ];
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

    /**
     * @param $fileName
     * @return array - keys: imported files; value true or error message
     * @throws Exception
     */
    private function _importUnfiledZipArchive($fileName) {

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
            throw new HttpError("Folder does not exist: `$lookupFolder`", 500);
        }

        $lookupDir = opendir($lookupFolder);
        if ($lookupDir === false) {
            throw new HttpError("Could not open: `$lookupFolder`", 404);
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


    function getSysCheckReportList(): array {

        $allReports = $this->collectSysCheckReports();

        $allReportsByCheckIds = array_reduce($allReports, function($agg, SysCheckReportFile $report) {
            if (!isset($agg[$report->getCheckId()])) {
                $agg[$report->getCheckId()] = [$report];
            } else {
                $agg[$report->getCheckId()][] = $report;
            }
            return $agg;
        }, []);

        return array_map(function(array $reportSet, string $checkId) {

            return [
                'id' => $checkId,
                'count' => count($reportSet),
                'label' => $reportSet[0]->getCheckLabel(),
                'details' => SysCheckReportFile::getStatistics($reportSet)
            ];
        }, $allReportsByCheckIds, array_keys($allReportsByCheckIds));
    }


    function collectSysCheckReports(array $filterCheckIds = null): array {

        $reportFolderName = $this->_getSysCheckReportsPath();
        $reportDir = opendir($reportFolderName);
        $reports = [];

        while (($reportFileName = readdir($reportDir)) !== false) {

            $reportFilePath = $reportFolderName . '/' . $reportFileName;

            if (!is_file($reportFilePath) or !(strtoupper(substr($reportFileName, -5)) == '.JSON')) {
                continue;
            }

            $report = new SysCheckReportFile($reportFilePath);

            if (($filterCheckIds === null) or (in_array($report->getCheckId(), $filterCheckIds))) {

                $reports[] = $report;
            }
        }

        return $reports;
    }


    private function _getSysCheckReportsPath(): string {

        $sysCheckPath = $this->_workspacePath . '/SysCheck';
        if (!file_exists($sysCheckPath)) {
            mkdir($sysCheckPath);
        }
        $sysCheckReportsPath = $sysCheckPath . '/reports';
        if (!file_exists($sysCheckReportsPath)) {
            mkdir($sysCheckReportsPath);
        }
        return $sysCheckReportsPath;
    }


    public function deleteSysCheckReports(array $checkIds) : array {

        $reports = $this->collectSysCheckReports($checkIds);

        $filesToDelete = array_map(function(SysCheckReportFile $report) {
            return 'SysCheck/reports/' . $report->getFileName();
        }, $reports);

        return $this->deleteFiles($filesToDelete);
    }


    public function saveSysCheckReport(SysCheckReport $report): void {

        $reportFilename = $this->_getSysCheckReportsPath() . '/' . uniqid('report_', true) . '.json';

        if (!file_put_contents($reportFilename, json_encode((array) $report))) {
            throw new Exception("Could not write to file `$reportFilename`");
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


    public function findAvailableBookletsForLogin(string $name, string $password): array { // TODO unit-test

        foreach (Folder::glob($this->_getOrCreateSubFolderPath('Testtakers'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileTesttakers($fullFilePath);

            if ($xFile->isValid()) {
                if ($xFile->getRoottagName() == 'Testtakers') {
                    $myBooklets = $xFile->getLoginData($name, $password);
                    if (count($myBooklets['booklets']) > 0) {
                        $myBooklets['workspaceId'] = $this->_workspaceId;
                        $myBooklets['customTexts'] = $xFile->getCustomTexts();
                        return $myBooklets;
                    }
                }
            }
        }

        return [];
    }


    public function findAvailableSysChecks() {

        $sysChecks = [];

        foreach (Folder::glob($this->_getOrCreateSubFolderPath('SysCheck'), "*.[xX][mM][lL]") as $fullFilePath) {

            $xFile = new XMLFileSysCheck($fullFilePath);

            if ($xFile->isValid()) {
                if ($xFile->getRoottagName()  == 'SysCheck') {
                    $sysChecks[] = [
                        'workspaceId' => $this->_workspaceId,
                        'name' => $xFile->getId(),
                        'label' => $xFile->getLabel(),
                        'description' => $xFile->getDescription()
                    ];
                }
            }
        }

        return $sysChecks;
    }


    static function getAll(): array {

        $workspaceControllers = [];

        foreach (Folder::glob(DATA_DIR, 'ws_*') as $workspaceDir) {

            $workspaceId = array_pop(explode('_', $workspaceDir));
            $workspaceControllers[$workspaceId] = new WorkspaceController((int) $workspaceId);
        }

        return $workspaceControllers;
    }
}

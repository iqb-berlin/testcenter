<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class WorkspaceValidator extends Workspace {

    public $allFiles = [];

    private $allResources = [];
    private $allVersionedResources = [];
    private $allUsedResources = [];
    private $allUsedVersionedResources = [];
    private $allUnits = [];
    private $allUsedUnits = [];
    private $allBooklets = [];
    private $allUsedBooklets = [];
    public $allResourceFilesWithSize = [];
    private $allUnitsWithPlayer = [];
    private $allUnitsOnlyFilesize = [];
    private $allBookletsFilesize = [];
    private $validSysCheckCount = 0;
    private $testtakersCount = 0;
    private $allLoginNames = [];

    private array $report = [];

    function __construct(int $workspaceId) {

        parent::__construct($workspaceId);
        $this->readFiles();
    }

    private function readFiles() {

        $this->allFiles = [];

        foreach ($this::subFolders as $type) {

            $pattern = ($type == 'Resource') ? "*.*" : "*.[xX][mM][lL]";
            $files = Folder::glob($this->getOrCreateSubFolderPath($type), $pattern);

            $this->allFiles[$type] = [];

            foreach ($files as $file) {

                $this->allFiles[$type][$file] = new XMLFileUnit($file, true);
            }

        }
    }


    function validate(): array {

        $this->readResources();
        $this->readAndValidateUnits();
        $this->readAndValidateBooklets();
        $this->readAndValidateSysChecks();
        $this->readAndValidateLogins();

        // cross-file checks
        $this->checkIfLoginsAreUsedInOtherWorkspaces();
        $this->checkIfGroupsAreUsedInOtherFiles();

        // find unused resources, units and booklets
        $this->findUnusedItems();

        foreach($this->allBookletsFilesize as $booklet => $bytes) {
            $sizeString = FileSize::asString($bytes);
            $this->reportInfo("size fully loaded: `$sizeString`", $booklet);
        }

        return $this->report;
    }


    private function getReport(File $file) {

        $report = $file->getValidationReport();
        if (count($report)) {
            $this->report[$file->getName()] = $report;
        }
    }


    private function reportError(string $text, string $file = '.'): void {

        if (!isset($this->report[$file])) {
            $this->report[$file] = [];
        }
        $this->report[$file][] = new ValidationReportEntry('error', $text);
    }


    private function reportWarning(string $text, string $file = '.'): void {

        if (!isset($this->report[$file])) {
            $this->report[$file] = [];
        }
        $this->report[$file][] = new ValidationReportEntry('warning', $text);
    }


    private function reportInfo(string $text, string $file = '.'): void {

        if (!isset($this->report[$file])) {
            $this->report[$file] = [];
        }
        $this->report[$file][] = new ValidationReportEntry('info', $text);
    }


    public function resourceExists(string $resourceId, bool $useVersioning): bool {

        $resourceFileNameNormalized = FileName::normalize($resourceId, !$useVersioning);

        echo "\n#### $resourceId | $resourceFileNameNormalized |";
        print_r($this->allUsedVersionedResources);


        if (!$useVersioning && in_array($resourceFileNameNormalized, $this->allResources)) {

            if (!in_array($resourceFileNameNormalized, $this->allUsedResources)) {

                $this->allUsedResources[] = $resourceFileNameNormalized;
            }

            echo "### OK ### \n";
            return true;

        } else if ($useVersioning && in_array($resourceFileNameNormalized, $this->allVersionedResources)) {

            if (!in_array($resourceFileNameNormalized, $this->allUsedVersionedResources)) {

                echo "¡¡¡¡";
                $this->allUsedVersionedResources[] = $resourceFileNameNormalized;
            }

            echo "### OK2 ### \n";
            return true;
        }

        echo "### NOT-OK ### \n";
        return false;
    }


    private function unitExists(string $unitId): bool {

        if (in_array($unitId, $this->allUnits)) {

            if (!in_array($unitId, $this->allUsedUnits)) {

                $this->allUsedUnits[] = $unitId;
            }

            return true;
        }

        return false;
    }


    private function bookletExists(string $bookletName): bool {

        if (in_array(strtoupper($bookletName), $this->allBooklets)) {

            if (!in_array(strtoupper($bookletName), $this->allUsedBooklets)) {
                array_push($this->allUsedBooklets, strtoupper($bookletName));
            }

            return true;
        }

        return false;
    }


    private function readResources() {

        $resourceFolderPath = $this->_workspacePath . '/Resource';
        if (!file_exists($resourceFolderPath) or !is_dir($resourceFolderPath)) {
            $this->reportError("No Resource directory");
            return;
        }

        $resourceFolderHandle = opendir($resourceFolderPath);
        while (($entry = readdir($resourceFolderHandle)) !== false) {
            if (is_file($resourceFolderPath . '/' . $entry)) {
                $fileSize = filesize($resourceFolderPath . '/' . $entry);
                array_push($this->allResources, FileName::normalize($entry, false));
                $this->allResourceFilesWithSize[FileName::normalize($entry, false)] = $fileSize;
                array_push($this->allVersionedResources, FileName::normalize($entry, true));
                $this->allResourceFilesWithSize[FileName::normalize($entry, true)] = $fileSize;
            }
        }

        $this->reportInfo('`' . strval(count($this->allResources)) . '` resource files found');
    }


    private function readAndValidateUnits(): void {

        // DO duplicate unit id // $this->reportError("Duplicate unit id `$unitId`", $entry);
        // alos add test for that!

        foreach ($this->allFiles['Unit'] as $xFile) {

            /* @var XMLFileUnit $xFile */

            if (!$xFile->isValid()) {
                continue;
            }

            $xFile->setTotalSize($this);
            $xFile->setPlayerId($this);

            echo "\n######> ";
            echo $xFile->getPath();
            echo " <######> ";
            echo count($xFile->getValidationReport());
            echo " <######";

            if ($xFile->isValid()) {
                $this->allUnits[] = $xFile->getId();
                $this->allUnitsOnlyFilesize[$xFile->getId()] = $xFile->getTotalSize();
                $this->allUnitsWithPlayer[$xFile->getId()] = $xFile->getPlayerId();
            }

            $this->getReport($xFile);
        }
    }

    private function readAndValidateBooklets() {

        $bookletFolderPath = $this->getOrCreateSubFolderPath("Booklet");

        $resourceFolderHandle = opendir($bookletFolderPath);
        while (($entry = readdir($resourceFolderHandle)) !== false) {

            $fullFilename = $bookletFolderPath . '/' . $entry;
            if (!is_file($fullFilename) or (strtoupper(substr($entry, -4)) !== '.XML')) {
                continue;
            }

            $xFile = new XMLFileBooklet($fullFilename, true);
            if (!$xFile->isValid()) {
                $this->getReport($xFile);
                continue;
            }

            $bookletLoad = filesize($fullFilename);
            $bookletPlayers = [];
            $bookletId = $xFile->getId();
            if (in_array($bookletId, $this->allBooklets)) {
                $this->reportError("booklet id `$bookletId` is already used", $entry);
                continue;
            }

            foreach($xFile->getAllUnitIds() as $unitId) {

                if (!$this->unitExists($unitId)) {
                    $this->reportError("Unit `$unitId` not found", $entry);
                    continue;
                }

                $bookletLoad += $this->allUnitsOnlyFilesize[$unitId];
                $myPlayer = $this->allUnitsWithPlayer[$unitId];
                if (!in_array($myPlayer, $bookletPlayers)) {
                    if (isset($this->allResourceFilesWithSize[$myPlayer])) {
                        $bookletLoad += $this->allResourceFilesWithSize[$myPlayer];
                    } else {
                        $myPlayer = FileName::normalize($myPlayer, true);
                        if (isset($this->allResourceFilesWithSize[$myPlayer])) {
                            $bookletLoad += $this->allResourceFilesWithSize[$myPlayer];
                        } else {
                            $this->reportWarning("Resource `$myPlayer` not found in filesize-list", $entry);
                        }
                    }
                    array_push($bookletPlayers, $myPlayer);
                }
            }

            array_push($this->allBooklets, $bookletId);
            $this->allBookletsFilesize[$bookletId] = $bookletLoad;
        }

        $this->reportInfo('`' . strval(count($this->allBooklets)) . '` valid booklets found');
    }

    private function readAndValidateSysChecks() {

        $sysCheckFolderPath = $this->getOrCreateSubFolderPath("SysCheck");

        $resourceFolderHandle = opendir($sysCheckFolderPath);
        while (($entry = readdir($resourceFolderHandle)) !== false) {

            $fullFilename = $sysCheckFolderPath . '/' . $entry;
            if (!is_file($fullFilename) or (strtoupper(substr($entry, -4)) !== '.XML')) {
                continue;
            }

            $xFile = new XMLFileSysCheck($fullFilename, true);
            if (!$xFile->isValid()) {
                foreach($xFile->getErrors() as $r) {
                    $this->reportError("Error reading SysCheck-XML-file `$r`", $entry);
                }
                continue;
            }

            // TODO check unique id

            $unitId = $xFile->getUnitId();
            if (strlen($unitId) > 0) {
                if (!$this->unitExists($unitId)) {
                    $this->reportError("unit `$unitId`", $entry);
                } else {
                    $this->validSysCheckCount = $this->validSysCheckCount + 1;
                }
            } else {
                $this->validSysCheckCount = $this->validSysCheckCount + 1;
            }
        }
        $this->reportInfo('`' . strval($this->validSysCheckCount) . '` valid sys-checks found');
    }


    private function readAndValidateLogins() {

        $testTakersFolderPath = $this->getOrCreateSubFolderPath("Testtakers");

        $testtakersFolderHandle = opendir($testTakersFolderPath);
        while (($testtakersFile = readdir($testtakersFolderHandle)) !== false) {

            $fullFilename = $testTakersFolderPath . '/' . $testtakersFile;
            if (!is_file($fullFilename) or (strtoupper(substr($testtakersFile, -4)) !== '.XML')) {
                continue;
            }

            $xFile = new XMLFileTesttakers($fullFilename, true);
            if (!$xFile->isValid()) {
                $this->getReport($xFile);
                continue;
            }

            $errorBookletNames = [];
            $testtakers = $xFile->getAllTesttakers();

            $this->testtakersCount = $this->testtakersCount + count($testtakers);

            foreach ($testtakers as $testtaker) {
                foreach ($testtaker['booklets'] as $bookletId) {
                    if (!$this->bookletExists($bookletId)) {
                        if (!in_array($bookletId, $errorBookletNames)) {
                            $this->reportError("booklet `$bookletId` not found for login `{$testtaker['loginname']}`", $testtakersFile);
                            $errorBookletNames[] = $bookletId;
                        }
                    }
                }

                if (isset($this->allLoginNames[$testtaker['loginname']])) {
                    if ($this->allLoginNames[$testtaker['loginname']] !== $testtakersFile) {
                        $this->reportError("login `{$testtaker['loginname']}` in 
                            `$testtakersFile` is already used in: `{$this->allLoginNames[$testtaker['loginname']]}`", $testtakersFile);
                    }
                } else {
                    $this->allLoginNames[$testtaker['loginname']] = $testtakersFile;
                }
            }

            $doubleLogins = $xFile->getDoubleLoginNames();
            if (count($doubleLogins) > 0) {
                foreach ($doubleLogins as $ln) {
                    $this->reportError("duplicate loginname `$ln`", $testtakersFile);
                }
            }
        }

        $this->reportInfo('`' . strval($this->testtakersCount) . '` test-takers in `'
            . strval(count($this->allLoginNames)) . '` logins found');
    }

    private function checkIfLoginsAreUsedInOtherWorkspaces() {

        // TODO use TesttakersFolder

        $dataDirHandle = opendir($this->_dataPath);
        while (($workspaceDirName = readdir($dataDirHandle)) !== false) {

            if (!is_dir($this->_dataPath . '/' . $workspaceDirName) or (substr($workspaceDirName, 0, 3) !== 'ws_')) {
                continue;
            }

            $wsIdOther = intval(substr($workspaceDirName, 3));
            if (($wsIdOther < 0) or ($wsIdOther == $this->_workspaceId)) {
                continue;
            }

            $otherTesttakersFolder = $this->_dataPath . '/' . $workspaceDirName . '/Testtakers';
            if (!file_exists($otherTesttakersFolder) || !is_dir($otherTesttakersFolder)) {
                continue;
            }

            $otherTesttakersDirHandle = opendir($otherTesttakersFolder);

            while (($entry = readdir($otherTesttakersDirHandle)) !== false) {

                $fullFilename = $otherTesttakersFolder . '/' . $entry;

                if (is_file($fullFilename) && (strtoupper(substr($entry, -4)) == '.XML')) {

                    $xFile = new XMLFileTesttakers($fullFilename, true);

                    if ($xFile->isValid()) {

                        foreach($xFile->getAllLoginNames() as $loginName) {

                            if (isset($this->allLoginNames[$loginName])) {
                                $this->reportError("[`{$this->allLoginNames[$loginName]}`] login `$loginName` is 
                                    already used on other workspace `$wsIdOther` (`$entry`)", '?');
                            }
                        }
                    }
                }
            }
        }
    }


    private function checkIfGroupsAreUsedInOtherFiles() {

        $otherTesttakersFolder = new TesttakersFolder($this->_workspaceId);
        $this->allGroups = $otherTesttakersFolder->getAllGroups();

        foreach ($this->allGroups as $filePath => $groupList) {

            $fileName = basename($filePath);

            /* @var Group $group */
            foreach (TesttakersFolder::getAll() as $otherTesttakersFolder) {

                /* @var TesttakersFolder $otherTesttakersFolder */
                $allGroupsInOtherWorkspace = $otherTesttakersFolder->getAllGroups();

                foreach ($allGroupsInOtherWorkspace as $otherFilePath => $otherGroupList) {

                    if ($filePath == $otherFilePath) {
                        continue;
                    }

                    $duplicates = array_intersect_key($groupList, $otherGroupList);

                    if ($duplicates) {

                        foreach ($duplicates as $duplicate) {

                            $location = ($this->_workspaceId !== $otherTesttakersFolder->_workspaceId)
                                ? "also on workspace {$otherTesttakersFolder->_workspaceId}"
                                : '';
                            $this->reportError("Duplicate Group-Id: `{$duplicate->getName()}` - $location in file `"
                                . basename($otherFilePath) . "`", $fileName);
                        }
                    }

                }
            }
        }
    }


    private function findUnusedItems() {

        foreach($this->allResources as $r) {
            if (!in_array($r, $this->allUsedResources) && !in_array(FileName::normalize($r, true), $this->allUsedVersionedResources)) {
                $this->reportWarning('Resource is never used', $r);
            }
        }

        // TODO does not work!
        foreach($this->allUnits as $u) {
            if (!in_array($u, $this->allUsedUnits)) {
                $this->reportWarning('Unit is not used in any booklet', $u);
            }
        }

        foreach($this->allBooklets as $b) {
            if (!in_array($b, $this->allUsedBooklets)) {
                $this->reportWarning('Booklet not set up for any test-taker', $b);
            }
        }
    }


}

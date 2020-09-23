<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class WorkspaceValidator extends Workspace {

    private $allResources = [];
    private $allVersionedResources = [];
    private $allUsedResources = [];
    private $allUsedVersionedResources = [];
    private $allUnits = [];
    private $allUsedUnits = [];
    private $allBooklets = [];
    private $allUsedBooklets = [];
    private $allResourceFilesWithSize = [];
    private $allUnitsWithPlayer = [];
    private $allUnitsOnlyFilesize = [];
    private $allBookletsFilesize = [];
    private $validSysCheckCount = 0;
    private $testtakersCount = 0;
    private $allLoginNames = [];

    private array $report = [];

    function validate(): array {

        $this->readResources();
        $this->reportInfo('`' . strval(count($this->allResources)) . '` resource files found', '.');

        $this->readAndValidateUnits();
        $this->reportInfo('`' . strval(count($this->allUnits)) . ' valid units found', '.');

        // get all booklets and check units and resources
        $this->readAndValidateBooklets();
        $this->reportInfo('`' . strval(count($this->allBooklets)) . '` valid booklets found', '.');

        // get all syschecks and check units
        $this->readAndValidateSysChecks();
        $this->reportInfo('`' . strval($this->validSysCheckCount) . '` valid sys-checks found', '.');
        
        // get all logins and check booklets
        $this->readAndValidateLogins();
        $this->checkIfLoginsAreUsedInOtherWorkspaces();
        $this->checkIfGroupsAreUsedInOtherFiles();
        $this->reportInfo('`' . strval($this->testtakersCount) . '` test-takers in `'
            . strval(count($this->allLoginNames)) . '` logins found', '.');

        // find unused resources, units and booklets
        $this->findUnusedItems();

        foreach($this->allBookletsFilesize as $booklet => $bytes) {
            $sizeString = FileSize::asString($bytes);
            $this->reportInfo("size fully loaded: `$sizeString`", $booklet);
        }

        return $this->report;
    }


    private function reportError(string $text, string $file): void {

        if (!isset($this->report[$file])) {
            $this->report[$file] = [];
        }
        $this->report[$file][] = new ValidationReportEntry('error', $text);
    }


    private function reportWarning(string $text, string $file): void {

        if (!isset($this->report[$file])) {
            $this->report[$file] = [];
        }
        $this->report[$file][] = new ValidationReportEntry('warning', $text);
    }


    private function reportInfo(string $text, string $file): void {

        if (!isset($this->report[$file])) {
            $this->report[$file] = [];
        }
        $this->report[$file][] = new ValidationReportEntry('info', $text);
    }


    private function resourceExists(string $resourceId, bool $useVersioning): bool {

        $resourceFileNameNormalized = FileName::normalize($resourceId, !$useVersioning);

        if (!$useVersioning && in_array($resourceFileNameNormalized, $this->allResources)) {

            if (!in_array($resourceFileNameNormalized, $this->allUsedResources)) {

                $this->allUsedResources[] = $resourceFileNameNormalized;
            }

            return true;

        } else if ($useVersioning && in_array($resourceFileNameNormalized, $this->allVersionedResources)) {

            if (!in_array($resourceFileNameNormalized, $this->allUsedVersionedResources)) {

                $this->allUsedVersionedResources[] = $resourceFileNameNormalized;
            }

            return true;
        }

        return false;
    }


    private function unitExists(string $unitName): bool {

        if (in_array(strtoupper($unitName), $this->allUnits)) {

            if (!in_array(strtoupper($unitName), $this->allUsedUnits)) {

                $this->allUsedUnits[] = strtoupper($unitName);
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
            $this->reportError("No Resource directory", '.');
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
    }

    private function readAndValidateUnits() {

        $unitFolderPath = $this->_workspacePath . '/Unit';
        if (!file_exists($unitFolderPath) or !is_dir($unitFolderPath)) {
            $this->reportError('No Unit directory', '.');
            return;
        }

        $resourceFolderHandle = opendir($unitFolderPath);
        while (($entry = readdir($resourceFolderHandle)) !== false) {

            $fullFilename = $unitFolderPath . '/' . $entry;
            if (!is_file($fullFilename) or (strtoupper(substr($entry, -4)) !== '.XML')) {
                continue;
            }

            $xFile = new XMLFileUnit($fullFilename, true);
            if (!$xFile->isValid()) {
                foreach($xFile->getErrors() as $e) {
                    $this->reportError("Invalid vo-XML: $e", $entry);
                }
                continue;
            }

            if ($xFile->getRoottagName() != 'Unit') {
                $this->reportWarning("Invalid root-tag `{$xFile->getRoottagName()}`", $entry);
                continue;
            }

            $unitId = $xFile->getId();
            if (in_array($unitId, $this->allUnits)) {
                $this->reportError("Duplicate unit id `$unitId`", $entry);
                continue;
            }

            $ok = true;
            $fileSizeTotal = filesize($fullFilename);

            $definitionRef = $xFile->getDefinitionRef();
            if (strlen($definitionRef) > 0) {
                if ($this->resourceExists($definitionRef, false)) {
                    $fileSizeTotal += $this->allResourceFilesWithSize[FileName::normalize($definitionRef, false)];
                } else {
                    $this->reportError("definitionRef `$definitionRef` not found", $entry);
                    $ok = false;
                }
            }

            $myPlayer = strtoupper($xFile->getPlayer());
            if (strlen($myPlayer) > 0) {
                if (substr($myPlayer, -5) != '.HTML') {
                    $myPlayer = $myPlayer . '.HTML';
                }
                if (!$this->resourceExists($myPlayer, true)) {
                    $this->reportError("unit definition type `$myPlayer` not found", $entry);
                    $ok = false;
                }
            } else {
                $this->reportError("no player defined", $entry);
                $ok = false;
            }

            if ($ok == true) {
                array_push($this->allUnits, $unitId);
                $this->allUnitsOnlyFilesize[$unitId] = $fileSizeTotal;
                $this->allUnitsWithPlayer[$unitId] = $myPlayer;
            }
        }
    }

    private function readAndValidateBooklets() {

        $bookletFolderPath = $this->_workspacePath . '/Booklet';
        if (!file_exists($bookletFolderPath) or !is_dir($bookletFolderPath)) {
            $this->reportError('No Booklet directory', '.');
            return;
        }

        $resourceFolderHandle = opendir($bookletFolderPath);
        while (($entry = readdir($resourceFolderHandle)) !== false) {

            $fullFilename = $bookletFolderPath . '/' . $entry;
            if (!is_file($fullFilename) or (strtoupper(substr($entry, -4)) !== '.XML')) {
                continue;
            }

            $xFile = new XMLFileBooklet($fullFilename, true);
            if (!$xFile->isValid()) {
                foreach ($xFile->getErrors() as $r) {
                    $this->reportError("Error reading Booklet-XML-file: `$r`", $entry);
                }
                continue;
            }

            $rootTagName = $xFile->getRoottagName();
            if ($rootTagName != 'Booklet') {
                $this->reportError("Invalid root-tag `$rootTagName`", $entry);
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

    }

    private function readAndValidateSysChecks() {

        $sysCheckFolderPath = $this->_workspacePath . '/SysCheck';
        if (!file_exists($sysCheckFolderPath) or !is_dir($sysCheckFolderPath)) {
            return;
        }

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

            $rootTagName = $xFile->getRoottagName();
            if ($rootTagName != 'SysCheck') {
                $this->reportWarning("invalid root-tag `$rootTagName`", $entry);
                continue;
            }

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
    }

    private function readAndValidateLogins() {

        $testTakersFolderPath = $this->_workspacePath . '/Testtakers';
        if (!file_exists($testTakersFolderPath) or !is_dir($testTakersFolderPath)) {
            $this->reportError('No Testtakers directory', '.');
            return;
        }

        $testtakersFolderHandle = opendir($testTakersFolderPath);
        while (($testtakersFile = readdir($testtakersFolderHandle)) !== false) {

            $fullFilename = $testTakersFolderPath . '/' . $testtakersFile;
            if (!is_file($fullFilename) or (strtoupper(substr($testtakersFile, -4)) !== '.XML')) {
                continue;
            }

            $xFile = new XMLFileTesttakers($fullFilename, true);
            if (!$xFile->isValid()) {
                foreach ($xFile->getErrors() as $r) {
                    $this->reportError("Error reading test-takers-XML-file: `$r`", $testtakersFile);
                }
                continue;
            }

            $rootTagName = $xFile->getRoottagName();
            if ($rootTagName != 'Testtakers') {
                $this->reportWarning("Invalid root-tag: `$rootTagName`", $testtakersFile);
                continue;
            }

            $errorBookletNames = [];
            $testtakers = $xFile->getAllTesttakers();

            $this->testtakersCount = $this->testtakersCount + count($testtakers);

            foreach ($testtakers as $testtaker) {
                foreach ($testtaker['booklets'] as $bookletId) {
                    if (!$this->bookletExists($bookletId)) {
                        if (!in_array($bookletId, $errorBookletNames)) {
                            $this->reportError("booklet `$bookletId` not found for 
                                login `{$testtaker['loginname']}`", $testtakersFile);
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

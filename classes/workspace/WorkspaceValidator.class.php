<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test

class WorkspaceValidator extends WorkspaceController {

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

    private $_validationReport = ['errors' => [], 'warnings' => [], 'infos' => []];

    function validate() {

        $this->reset();

        $this->readResources();
        $this->reportInfo(strval(count($this->allResources)) . ' resource files found');

        $this->readAndValidateUnits();
        $this->reportInfo(strval(count($this->allUnits)) . ' valid units found');

        // get all booklets and check units and resources
        $this->readAndValidateBooklets();
        $this->reportInfo(strval(count($this->allBooklets)) . ' valid booklets found');

        // get all syschecks and check units
        $this->readAndValidateSysChecks();
        $this->reportInfo(strval($this->validSysCheckCount) . ' valid syschecks found');
        
        // get all logins and check booklets
        $this->readAndValidateLogins();
        $this->checkIfLoginsAreUsedInOtherWorkspaces();
        $this->checkIfGroupsAreUsedInOtherWorkspaces();
        $this->reportInfo(strval($this->testtakersCount) . ' testtakers in ' . strval(count($this->allLoginNames)) . ' logins found');

        // find unused resources, units and booklets
        $this->findUnusedItems();

        if (asort($this->allBookletsFilesize, SORT_NUMERIC)) {
            $this->reportInfo('booklet loaded (bytes, sorted):');
        } else {
            $this->reportInfo('booklet loaded (bytes, not sorted):');
        }

        foreach(array_keys($this->allBookletsFilesize) as $b) {
            $this->reportInfo('    ' . $b . ': ' .  number_format($this->allBookletsFilesize[$b], 0, "," , "." ));
        }

        return $this->_validationReport;
    }

    private function reportError($text) {

        $this->_validationReport['errors'][] = $text;
    }

    private function reportWarning($text) {

        $this->_validationReport['warnings'][] = $text;
    }

    private function reportInfo($text) {

        $this->_validationReport['infos'][] = $text;
    }
    
    private function reset() {

        $this->allResources = [];
        $this->allVersionedResources = [];
        $this->allUsedResources = [];
        $this->allUsedVersionedResources = [];
        $this->allUnits = [];
        $this->allUsedUnits = [];
        $this->allBooklets = [];
        $this->allUsedBooklets = [];

        $this->allResourceFilesWithSize = [];
        $this->allUnitsWithPlayer = [];
        $this->allUnitsOnlyFilesize = [];
        $this->allBookletsFilesize = [];
        $this->validSysCheckCount = 0;
        $this->testtakersCount = 0;
        $this->allLoginNames = [];

        $this->_validationReport = ['errors' => [], 'warnings' => [], 'infos' => []];
    }


    private function resourceExists($r, $v) {

        $myExistsReturn = false;
        $rNormalised1 = FileName::normalize($r, false);
        $rNormalised2 = FileName::normalize($r, true);
        if (in_array($rNormalised1, $this->allResources)) {
            if (!in_array($rNormalised1, $this->allUsedResources)) {
                array_push($this->allUsedResources, $rNormalised1);
            }
            $myExistsReturn = true;
        } elseif ($v && in_array($rNormalised2, $this->allVersionedResources)) {
            if (!in_array($rNormalised2, $this->allUsedVersionedResources)) {
                array_push($this->allUsedVersionedResources, $rNormalised2);
            }
            $myExistsReturn = true;
        }
        return $myExistsReturn;
    }

    private function unitExists($u) {

        $myExistsReturn = false;
        if (in_array(strtoupper($u), $this->allUnits)) {
            if (!in_array(strtoupper($u), $this->allUsedUnits)) {
                array_push($this->allUsedUnits, strtoupper($u));
            }
            $myExistsReturn = true;
        }
        return $myExistsReturn;
    }

    private function bookletExists($b) {

        $myExistsReturn = false;
        if (in_array(strtoupper($b), $this->allBooklets)) {
            if (!in_array(strtoupper($b), $this->allUsedBooklets)) {
                array_push($this->allUsedBooklets, strtoupper($b));
            }
            $myExistsReturn = true;
        }
        return $myExistsReturn;
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
    }

    private function readAndValidateUnits() {

        $unitFolderPath = $this->_workspacePath . '/Unit';
        if (!file_exists($unitFolderPath) or !is_dir($unitFolderPath)) {
            $this->reportError('No Unit directory');
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
                    $this->reportError('Unit "' . $entry . '" is not valid vo-XML: ' . $e);
                }
                continue;
            }

            if ($xFile->getRoottagName() != 'Unit') {
                $this->reportWarning('invalid root-tag "' . $xFile->getRoottagName() . '" in Unit-XML-file "' . $entry . '"');
                continue;
            }

            $unitId = $xFile->getId();
            if (in_array($unitId, $this->allUnits)) {
                $this->reportError('double unit id "' . $unitId . '" in Unit-XML-file "' . $entry . '"');
                continue;
            }

            $ok = true;
            $fileSizeTotal = filesize($fullFilename);

            $definitionRef = $xFile->getDefinitionRef();
            if (strlen($definitionRef) > 0) {
                if ($this->resourceExists($definitionRef, false)) {
                    $fileSizeTotal += $this->allResourceFilesWithSize[FileName::normalize($definitionRef, false)];
                } else {
                    $this->reportError('definitionRef "' . $definitionRef . '" not found (required in Unit-XML-file "' . $entry . '"');
                    $ok = false;
                }
            }

            $myPlayer = strtoupper($xFile->getPlayer());
            if (strlen($myPlayer) > 0) {
                if (substr($myPlayer, -5) != '.HTML') {
                    $myPlayer = $myPlayer . '.HTML';
                }
                if (!$this->resourceExists($myPlayer, true)) {
                    $this->reportError('unit definition type "' . $myPlayer . '" not found (required in Unit-XML-file "' . $entry . '")');
                    $ok = false;
                }
            } else {
                $this->reportError('no player defined in Unit-XML-file "' . $entry . '"');
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
            $this->reportError('No Booklet directory');
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
                    $this->reportError('error reading Booklet-XML-file "' . $entry . '": ' . $r);
                }
                continue;
            }

            $rootTagName = $xFile->getRoottagName();
            if ($rootTagName != 'Booklet') {
                $this->reportError('invalid root-tag "' . $rootTagName . '" in Booklet-XML-file "' . $entry . '"');
                continue;
            }

            $bookletLoad = filesize($fullFilename);
            $bookletPlayers = [];
            $bookletId = $xFile->getId();
            if (in_array($bookletId, $this->allBooklets)) {
                $this->reportError('double booklet id "' . $bookletId . '" in Booklet-XML-file "' . $entry . '"');
                continue;
            }

            foreach($xFile->getAllUnitIds() as $unitId) {

                if (!$this->unitExists($unitId)) {
                    $this->reportError('unit "' . $unitId . '" not found (required in Booklet-XML-file "' . $entry . '" (ignore booklet)');
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
                            $this->reportWarning('resource "' . $myPlayer . '" not found in filesize-list');
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
            $this->reportError('No SysCheck directory');
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
                    $this->reportError('error reading SysCheck-XML-file "' . $entry . '": ' . $r);
                }
                continue;
            }

            $rootTagName = $xFile->getRoottagName();
            if ($rootTagName != 'SysCheck') {
                $this->reportWarning('invalid root-tag "' . $rootTagName . '" in SysCheck-XML-file "' . $entry . '"');
                continue;
            }

            $unitId = $xFile->getUnitId();
            if (strlen($unitId) > 0) {
                if (!$this->unitExists($unitId)) {
                    $this->reportError('unit "' . $unitId . '" not found (required in SysCheck-XML-file "' . $entry . '")');
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
            $this->reportError('No Testtakers directory');
            return;
        }

        $testtakersFolderHandle = opendir($testTakersFolderPath);
        while (($entry = readdir($testtakersFolderHandle)) !== false) {

            $fullFilename = $testTakersFolderPath . '/' . $entry;
            if (!is_file($fullFilename) or (strtoupper(substr($entry, -4)) !== '.XML')) {
                continue;
            }

            $xFile = new XMLFileTesttakers($fullFilename, true);
            if (!$xFile->isValid()) {
                foreach ($xFile->getErrors() as $r) {
                    $this->reportError('error reading Testtakers-XML-file "' . $entry . '": ' . $r);
                }
                continue;
            }

            $rootTagName = $xFile->getRoottagName();
            if ($rootTagName != 'Testtakers') {
                $this->reportWarning('invalid root-tag "' . $rootTagName . '" in Testtakers-XML-file "' . $entry . '"');
                continue;
            }

            $errorBookletNames = [];
            $testtakers = $xFile->getAllTesttakers();
            $this->testtakersCount = $this->testtakersCount + count($testtakers);
            foreach ($testtakers as $testtaker) {
                foreach ($testtaker['booklets'] as $bookletId) {
                    if (!$this->bookletExists($bookletId)) {
                        if (!in_array($bookletId, $errorBookletNames)) {
                            $this->reportError('booklet "' . $bookletId . '" not found for login "' . $testtaker['loginname'] . '" in Testtakers-XML-file "' . $entry . '"');
                            array_push($errorBookletNames, $bookletId);
                        }
                    }
                }
                if (!in_array($testtaker['loginname'], $this->allLoginNames)) {
                    $this->allLoginNames[] = $testtaker['loginname'];
                    $this->reportError("login `{$testtaker['loginname']}` in `$entry` is allready used in another file on this workspace");
                }
            }

            $doubleLogins = $xFile->getDoubleLoginNames();
            if (count($doubleLogins) > 0) {
                foreach ($doubleLogins as $ln) {
                    $this->reportError('loginname "' . $ln . '" appears more often then once in Testtakers-XML-file "' . $entry . '"');
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

                        foreach($xFile->getAllLoginNames() as $ln) {

                            if (in_array($ln, $this->allLoginNames)) {
                                $this->reportError('double login "' . $ln . '" in Testtakers-XML-file "' . $entry . '" (other workspace "' . $wsIdOther . '")');
                            }
                        }
                    }
                }
            }
        }
    }


    private function checkIfGroupsAreUsedInOtherWorkspaces() {

        $testtakersFolder = new TesttakersFolder($this->_workspaceId);
        $this->allGroups = $testtakersFolder->getAllGroups();

        foreach ($this->allGroups as $group) {

            /* @var Group $group */
            foreach (TesttakersFolder::getAll() as $testtakersFolder) {

                /* @var TesttakersFolder $testtakersFolder */
                if ($testtakersFolder->getWorkspacePath() == $this->getWorkspacePath()) {
                    continue;
                }

                if ($duplicate = $testtakersFolder->findGroup($group->getName())) {

                    /* @var Group $duplicate */
                    $this->reportError("Group-Id `{$duplicate->getName()}` also found on workspace {$testtakersFolder->_workspaceId}");
                }
            }
        }
    }


    private function findUnusedItems() {

        foreach($this->allResources as $r) {
            if (!in_array($r, $this->allUsedResources) && !in_array(FileName::normalize($r, true), $this->allUsedVersionedResources)) {
                $this->reportWarning('Resource "' . $r . '" never used');
            }
        }

        foreach($this->allUnits as $u) {
            if (!in_array($u, $this->allUsedUnits)) {
                $this->reportWarning('Unit "' . $u . '" not used in booklets');
            }
        }

        foreach($this->allBooklets as $b) {
            if (!in_array($b, $this->allUsedBooklets)) {
                $this->reportWarning('Booklet "' . $b . '" not used by testtakers');
            }
        }
    }



}

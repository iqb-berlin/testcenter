<?php


class WorkspaceValidator extends WorkspaceController {

    private $_allResources = [];
    private $_allVersionedResources = [];
    private $_allUsedResources = [];
    private $_allUsedVersionedResources = [];
    private $_allUnits = [];
    private $_allUsedUnits = [];
    private $_allBooklets = [];
    private $_allUsedBooklets = [];
    private $_allResourceFilesWithSize = [];
    private $_allUnitsWithPlayer = [];
    private $_allUnitsOnlyFilesize = [];
    private $_allBookletsFilesize = [];
    private $_validSysCheckCount = 0;
    private $_testtakersCount = 0;
    private $_allLoginNames = [];

    private $_validationReport = ['errors' => [], 'warnings' => [], 'infos' => []];

    function validate() {

        $this->reset();

        $this->readResources();
        $this->reportInfo(strval(count($this->_allResources)) . ' resource files found');

        $this->readAndValidateUnits();
        $this->reportInfo(strval(count($this->_allUnits)) . ' valid units found');

        // get all booklets and check units and resources
        $this->readAndValidateBooklets();
        $this->reportInfo(strval(count($this->_allBooklets)) . ' valid booklets found');

        // get all syschecks and check units
        $this->readAndValidateSysChecks();
        $this->reportInfo(strval($this->_validSysCheckCount) . ' valid syschecks found');
        
        // get all logins and check booklets
        $this->readAndValidateLogins();
        $this->checkIfLoginsAreUsedInOtherWorkspaces();
        $this->reportInfo(strval($this->_testtakersCount) . ' testtakers in ' . strval(count($this->_allLoginNames)) . ' logins found');

        // find unused resources, units and booklets
        $this->findUnusedItems();

        if (asort($this->_allBookletsFilesize, SORT_NUMERIC)) {
            $this->reportInfo('booklet loaded (bytes, sorted):');
        } else {
            $this->reportInfo('booklet loaded (bytes, not sorted):');
        };

        foreach(array_keys($this->_allBookletsFilesize) as $b) {
            $this->reportInfo('    ' . $b . ': ' .  number_format($this->_allBookletsFilesize[$b], 0, "," , "." ));
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

        $this->_allResources = [];
        $this->_allVersionedResources = [];
        $this->_allUsedResources = [];
        $this->_allUsedVersionedResources = [];
        $this->_allUnits = [];
        $this->_allUsedUnits = [];
        $this->_allBooklets = [];
        $this->_allUsedBooklets = [];

        $this->_allResourceFilesWithSize = [];
        $this->_allUnitsWithPlayer = [];
        $this->_allUnitsOnlyFilesize = [];
        $this->_allBookletsFilesize = [];
        $this->_validSysCheckCount = 0;
        $this->_testtakersCount = 0;
        $this->_allLoginNames = [];

        $this->_validationReport = ['errors' => [], 'warnings' => [], 'infos' => []];
    }

    private function normaliseFileName($fn, $v) {

        $normalizedFilename = strtoupper($fn);
        if ($v) {
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

    private function resourceExists($r, $v) {

        $myExistsReturn = false;
        $rNormalised1 = $this->normaliseFileName($r, false);
        $rNormalised2 = $this->normaliseFileName($r, true);
        if (in_array($rNormalised1, $this->_allResources)) {
            if (!in_array($rNormalised1, $this->_allUsedResources)) {
                array_push($this->_allUsedResources, $rNormalised1);
            }
            $myExistsReturn = true;
        } elseif ($v && in_array($rNormalised2, $this->_allVersionedResources)) {
            if (!in_array($rNormalised2, $this->_allUsedVersionedResources)) {
                array_push($this->_allUsedVersionedResources, $rNormalised2);
            }
            $myExistsReturn = true;
        }
        return $myExistsReturn;
    }

    private function unitExists($u) {

        $myExistsReturn = false;
        if (in_array(strtoupper($u), $this->_allUnits)) {
            if (!in_array(strtoupper($u), $this->_allUsedUnits)) {
                array_push($this->_allUsedUnits, strtoupper($u));
            }
            $myExistsReturn = true;
        }
        return $myExistsReturn;
    }

    private function bookletExists($b) {

        $myExistsReturn = false;
        if (in_array(strtoupper($b), $this->_allBooklets)) {
            if (!in_array(strtoupper($b), $this->_allUsedBooklets)) {
                array_push($this->_allUsedBooklets, strtoupper($b));
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
                array_push($this->_allResources, $this->normaliseFileName($entry, false));
                $this->_allResourceFilesWithSize[$this->normaliseFileName($entry, false)] = $fileSize;
                array_push($this->_allVersionedResources, $this->normaliseFileName($entry, true));
                $this->_allResourceFilesWithSize[$this->normaliseFileName($entry, true)] = $fileSize;
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
            if (in_array($unitId, $this->_allUnits)) {
                $this->reportError('double unit id "' . $unitId . '" in Unit-XML-file "' . $entry . '"');
                continue;
            }

            $ok = true;
            $fileSizeTotal = filesize($fullFilename);

            $definitionRef = $xFile->getDefinitionRef();
            if (strlen($definitionRef) > 0) {
                if ($this->resourceExists($definitionRef, false)) {
                    $fileSizeTotal += $this->_allResourceFilesWithSize[$this->normaliseFileName($definitionRef, false)];
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
                array_push($this->_allUnits, $unitId);
                $this->_allUnitsOnlyFilesize[$unitId] = $fileSizeTotal;
                $this->_allUnitsWithPlayer[$unitId] = $myPlayer;
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
            if (in_array($bookletId, $this->_allBooklets)) {
                $this->reportError('double booklet id "' . $bookletId . '" in Booklet-XML-file "' . $entry . '"');
                continue;
            }

            foreach($xFile->getAllUnitIds() as $unitId) {

                if (!$this->unitExists($unitId)) {
                    $this->reportError('unit "' . $unitId . '" not found (required in Booklet-XML-file "' . $entry . '" (ignore booklet)');
                    continue;
                }

                $bookletLoad += $this->_allUnitsOnlyFilesize[$unitId];
                $myPlayer = $this->_allUnitsWithPlayer[$unitId];
                if (!in_array($myPlayer, $bookletPlayers)) {
                    if (isset($this->_allResourceFilesWithSize[$myPlayer])) {
                        $bookletLoad += $this->_allResourceFilesWithSize[$myPlayer];
                    } else {
                        $myPlayer = $this->normaliseFileName($myPlayer, true);
                        if (isset($this->_allResourceFilesWithSize[$myPlayer])) {
                            $bookletLoad += $this->_allResourceFilesWithSize[$myPlayer];
                        } else {
                            $this->reportWarning('resource "' . $myPlayer . '" not found in filesize-list');
                        }
                    }
                    array_push($bookletPlayers, $myPlayer);
                }
            }

            array_push($this->_allBooklets, $bookletId);
            $this->_allBookletsFilesize[$bookletId] = $bookletLoad;
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
                    $this->_validSysCheckCount = $this->_validSysCheckCount + 1;
                }
            } else {
                $this->_validSysCheckCount = $this->_validSysCheckCount + 1;
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
            $myTesttakers = $xFile->getAllTesttakers();
            $this->_testtakersCount = $this->_testtakersCount + count($myTesttakers);
            foreach ($myTesttakers as $testtaker) {
                foreach ($testtaker['booklets'] as $bookletId) {
                    if (!$this->bookletExists($bookletId)) {
                        if (!in_array($bookletId, $errorBookletNames)) {
                            $this->reportError('booklet "' . $bookletId . '" not found for login "' . $testtaker['loginname'] . '" in Testtakers-XML-file "' . $entry . '"');
                            array_push($errorBookletNames, $bookletId);
                        }
                    }
                }
                if (!in_array($testtaker['loginname'], $this->_allLoginNames)) {
                    array_push($this->_allLoginNames, $testtaker['loginname']);
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
            $wsName = $this->_dbConnection->getWorkspaceName($wsIdOther);

            while (($entry = readdir($otherTesttakersDirHandle)) !== false) {

                $fullFilename = $otherTesttakersFolder . '/' . $entry;
                if (is_file($fullFilename) && (strtoupper(substr($entry, -4)) == '.XML')) {
                    $xFile = new XMLFileTesttakers($fullFilename, true);
                    if ($xFile->isValid()) {
                        foreach($xFile->getAllLoginNames() as $ln) {
                            if (in_array($ln, $this->_allLoginNames)) {
                                $this->reportError('double login "' . $ln . '" in Testtakers-XML-file "' . $entry . '" (other workspace "' . $wsName . '")');
                            }
                        }
                    }
                }
            }
        }
    }

    private function findUnusedItems() {

        foreach($this->_allResources as $r) {
            if (!in_array($r, $this->_allUsedResources) && !in_array($this->normaliseFileName($r, true), $this->_allUsedVersionedResources)) {
                $this->reportWarning('Resource "' . $r . '" never used');
            }
        }

        foreach($this->_allUnits as $u) {
            if (!in_array($u, $this->_allUsedUnits)) {
                $this->reportWarning('Unit "' . $u . '" not used in booklets');
            }
        }

        foreach($this->_allBooklets as $b) {
            if (!in_array($b, $this->_allUsedBooklets)) {
                $this->reportWarning('Booklet "' . $b . '" not used by testtakers');
            }
        }
    }



}

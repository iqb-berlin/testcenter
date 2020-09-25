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

    public $resourceSizes = [];
    public $unitPlayers = [];
    public $unitFilesizes = [];
    public $bookletSizes = [];

    public $allLoginNames = [];

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

                $this->allFiles[$type][$file] = XMLFile::get($type, $file, true);
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

        foreach($this->bookletSizes as $booklet => $bytes) {
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


    public function unitExists(string $unitId): bool {

        if (in_array($unitId, $this->allUnits)) {

            if (!in_array($unitId, $this->allUsedUnits)) {

                $this->allUsedUnits[] = $unitId;
            }

            return true;
        }

        return false;
    }


    public function bookletExists(string $bookletName): bool {

        if (in_array(strtoupper($bookletName), $this->allBooklets)) {

            if (!in_array(strtoupper($bookletName), $this->allUsedBooklets)) {
                array_push($this->allUsedBooklets, strtoupper($bookletName));
            }

            return true;
        }

        return false;
    }


    private function readResources() {

        foreach ($this->allFiles['Resource'] as $rFile) {

            /* @var ResourceFile $rFile */
            $this->allResources[] = FileName::normalize($rFile->getName(), false);
            $this->resourceSizes[FileName::normalize($rFile->getName(), false)] = $rFile->getSize();
            $this->allVersionedResources[] = FileName::normalize($rFile->getName(), true);
            $this->resourceSizes[FileName::normalize($rFile->getName(), true)] = $rFile->getSize();
        }

        $this->reportInfo('`' . strval(count($this->allResources)) . '` resource files found');
    }


    private function readAndValidateUnits(): void {

        // DO duplicate unit id // $this->reportError("Duplicate unit id `$unitId`", $entry);
        // alos add test for that!

        foreach ($this->allFiles['Unit'] as $xFile) {

            /* @var XMLFileUnit $xFile */

            if ($xFile->isValid()) {
                $xFile->setTotalSize($this);
                $xFile->setPlayerId($this);

                if ($xFile->isValid()) {
                    $this->allUnits[] = $xFile->getId();
                    $this->unitFilesizes[$xFile->getId()] = $xFile->getTotalSize();
                    $this->unitPlayers[$xFile->getId()] = $xFile->getPlayerId();
                }
            }

            $this->getReport($xFile);
        }
    }

    private function readAndValidateBooklets() {

        // DO duplicate booklet id // $this->reportError("Duplicate unit id `$unitId`", $entry);

        foreach ($this->allFiles['Booklet'] as $xFile) {

            /* @var XMLFileBooklet $xFile */

            if ($xFile->isValid()) {

                $xFile->setTotalSize($this);

                if ($xFile->isValid()) {
                    $this->allBooklets[] = $xFile->getId();
                    $this->bookletSizes[$xFile->getId()] = $xFile->getTotalSize();
                }
            }


            $this->getReport($xFile);
        }

        $this->reportInfo('`' . strval(count($this->allBooklets)) . '` valid booklets found');
    }

    private function readAndValidateSysChecks() {

        // TODO check unique id

        $validSysCheckCount = 0;

        foreach ($this->allFiles['SysCheck'] as $xFile) {

            /* @var XMLFileSysCheck $xFile */

            if ($xFile->isValid()) {

                $xFile->crossValidate($this);
                $validSysCheckCount = $validSysCheckCount + ($xFile->isValid() ? 1 : 0);
            }
        }

        $this->reportInfo("`$validSysCheckCount` valid sys-checks found");
    }


    private function readAndValidateLogins() {

        $testtakersCount = 0;

        foreach ($this->allFiles['Testtakers'] as $xFile) {

            /* @var XMLFileTesttakers $xFile */

            if ($xFile->isValid()) {

                $xFile->crossValidate($this);

                if ($xFile->isValid()) {
                    $testtakersCount++;
                }
            }

            $this->getReport($xFile);
        }

        $this->reportInfo('`$testtakersCount` test-takers in `'
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

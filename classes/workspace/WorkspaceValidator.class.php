<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// TODO unit test


class WorkspaceValidator extends Workspace {

    public $allFiles = [];

    private array $report = [];

    private function readFiles() {

        $this->allFiles = [];

        foreach ($this::subFolders as $type) {

            $pattern = ($type == 'Resource') ? "*.*" : "*.[xX][mM][lL]";
            $files = Folder::glob($this->getOrCreateSubFolderPath($type), $pattern);

            $this->allFiles[$type] = [];

            foreach ($files as $filePath) {

                $file = File::get($type, $filePath, true);

                if (isset($this->allFiles[$type][$file->getId()])) {

                    $double = $this->allFiles[$type][$file->getId()];
                    $this->report('error', "Duplicate $type-Id: `{$file->getId()}` `({$double->getName()})`", $file);
                    $this->report('error', "Duplicate $type-Id: `{$double->getId()}` `({$file->getName()})`", $double);
                    unset($this->allFiles[$type][$file->getId()]);

                } else {

                    $this->allFiles[$type][$file->getId()] = $file;
                }

            }

        }

//        echo "\n =====";
//        var_dump($this->allFiles);
//        echo "\n =====";
    }


    function validate(): array {

        $this->readFiles();

        $this->crossValidate();

        // cross-file checks
        $this->checkIfGroupsAreUsedInOtherFiles();

        // find unused resources, units and booklets
        $this->findUnusedItems();


        return $this->report;
    }


    private function getReport(File $file) {

        if (!count($file->getValidationReport())) {
            return;
        }

        $fileCode = $file ? $file::type . "/{$file->getName()}" : '.';

        if (!isset($this->report[$fileCode])) {
            $this->report[$fileCode] = [];
        }

        foreach($file->getValidationReport() as /* @var ValidationReportEntry */ $entry) {
            $this->report[$fileCode][] = $entry;
        }
    }


    private function report(string $level, string $text, ?File $file = null) {

        $fileCode = $file ? $file::type . "/{$file->getName()}" : '.';

        if (!isset($this->report[$fileCode])) {
            $this->report[$fileCode] = [];
        }

        $this->report[$fileCode][] = new ValidationReportEntry($level, $text);
    }


    public function getResource(string $resourceId): ?ResourceFile {

        if (isset($this->allFiles['Resource'][$resourceId])) {
            return $this->allFiles['Resource'][$resourceId];
        }

        return null;
    }


    public function getUnit(string $unitId): ?XMLFileUnit {

        if (isset($this->allFiles['Unit'][$unitId])) {
            return $this->allFiles['Unit'][$unitId];
        }

        return null;
    }


    public function getBooklet(string $bookletId): ?XMLFileBooklet {

        if (isset($this->allFiles['Booklet'][$bookletId])) {
            return $this->allFiles['Booklet'][$bookletId];
        }

        return null;
    }


    private function crossValidate(): void {

        // DO count of teststakers

        foreach (['Resource', 'Unit', 'Booklet', 'Testtakers', 'SysCheck'] as $type) {

            $countCrossValidated = 0;

            foreach ($this->allFiles[$type] as $file) {

                /* @var File $file */

                if ($file->isValid()) {

                    $file->crossValidate($this);

                    if ($file->isValid()) {

                        $countCrossValidated += 1;
                    }
                }

                $this->getReport($file);
            }

            $this->report('info', "`$countCrossValidated` valid $type-files found");
        }
    }

    private function checkIfGroupsAreUsedInOtherFiles() {

        $thisTesttakersFolder = new TesttakersFolder($this->_workspaceId);
        $allGroups = $thisTesttakersFolder->getAllGroups();

        foreach ($allGroups as $filePath => $groupList) {

            /* @var Group $group */
            foreach (TesttakersFolder::getAll() as $otherTesttakersFolder) {

                /* @var TesttakersFolder $otherTesttakersFolder */
                $allGroupsInOtherWorkspace = $otherTesttakersFolder->getAllGroups();

                foreach ($allGroupsInOtherWorkspace as $otherFilePath => $otherGroupList) {

                    if ($filePath == $otherFilePath) {
                        continue;
                    }

                    $duplicates = array_intersect_key($groupList, $otherGroupList);

                    foreach ($duplicates as $duplicate) {

                        $location = ($this->_workspaceId !== $otherTesttakersFolder->_workspaceId)
                            ? "also on workspace {$otherTesttakersFolder->_workspaceId}"
                            : '';
                        $message = "Duplicate Group-Id: `{$duplicate->getName()}` - $location in file `" . basename($otherFilePath) . "`";

                        $fileCode = 'Testtakers/' . basename($filePath);
                        if (!isset($this->report[$fileCode])) {
                            $this->report[$fileCode] = [];
                        }
                        $this->report[$fileCode][] = new ValidationReportEntry('error', $message);
                    }
                }
            }
        }
    }


    private function findUnusedItems() {

        foreach (['Resource', 'Unit', 'Booklet'] as $type) {

            foreach($this->allFiles[$type] as /* @var File */ $file) {
                if (!$file->isUsed()) {
                    $this->report('warning', "$type is never used", $file);
                }
            }
        }
    }
}

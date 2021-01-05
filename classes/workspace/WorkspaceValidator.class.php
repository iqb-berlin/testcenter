<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class WorkspaceValidator extends Workspace {

    protected array $allFiles = [];
    protected array $versionMap = [];
    private array $report = [];


    function __construct(int $workspaceId) {

        parent::__construct($workspaceId);
        $this->readFiles();
        $this->createVersionMap();
    }


    public function validate(): array {
        $this->crossValidate();
        $this->findUnusedItems();
        $this->countTestTakers();
        return $this->report;
    }


    public function getFiles(): array {

        return call_user_func_array('array_merge', array_map('array_values', $this->allFiles));
    }


    public function getResource(string $resourceId, bool $ignoreMinorAndPatchVersion): ?ResourceFile {

        if ($ignoreMinorAndPatchVersion) {

            $mayorVersionResourceId = FileName::normalize($resourceId, true);

            // minor version given, and exact this version exists
            if (($mayorVersionResourceId !== $resourceId) and isset($this->allFiles['Resource'][$resourceId])) {

                return $this->allFiles['Resource'][$resourceId];
            }

            // other major version exists, or no minor version specified
            if (isset($this->versionMap[$mayorVersionResourceId])) {

                return $this->allFiles['Resource'][$this->versionMap[$mayorVersionResourceId]];
            }
        }

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


    public function getSysCheck(string $sysCheckId): ?XMLFileSysCheck {

        if (isset($this->allFiles['SysCheck'][$sysCheckId])) {
            return $this->allFiles['SysCheck'][$sysCheckId];
        }

        return null;
    }

    private function readFiles() {

        $this->allFiles = [];

        foreach ($this::subFolders as $type) {

            $pattern = ($type == 'Resource') ? "*.*" : "*.[xX][mM][lL]";
            $files = Folder::glob($this->getOrCreateSubFolderPath($type), $pattern);

            $this->allFiles[$type] = [];

            foreach ($files as $filePath) {

                $file = File::get($filePath, $type, true);

                if (isset($this->allFiles[$type][$file->getId()])) {

                    $double = $this->allFiles[$type][$file->getId()];
                    $file->report('error', "Duplicate $type-Id: `{$file->getId()}` `({$double->getName()})`");
                    $double->report('error', "Duplicate $type-Id: `{$double->getId()}` `({$file->getName()})`");
                    $this->allFiles[$type][$this->getDuplicateId($type, $file->getId())] = $file;

                } else {

                    $this->allFiles[$type][$file->getId()] = $file;
                }
            }
        }
    }


    private function getDuplicateId(string $type, string $id): string {

        $i = 2;
        while (isset($this->allFiles[$type]["$id.$i"])) {
            $i++;
        }
        return "$id.$i";
    }


    protected function createVersionMap(): void {

        uksort($this->allFiles['Resource'], function($rId1, $rId2) {
            $rId1 = substr($rId1, 0, strrpos($rId1, "."));
            $rId2 = substr($rId2, 0, strrpos($rId2, "."));
            return strcasecmp($rId1, $rId2);
        });
        $this->versionMap = [];
        foreach ($this->allFiles['Resource'] as $key => $value) {
            $this->versionMap[FileName::normalize($key, true)] = $key;
        }
    }


    private function crossValidate(): void {

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

                $this->importReport($file);
            }

            $this->report('info', "`$countCrossValidated` valid $type-files found");
        }
    }


    private function importReport(File $file) {

        if (!count($file->getValidationReport())) {
            return;
        }

        $fileCode = $file ? "{$file->getType()}/{$file->getName()}" : '.';

        if (!isset($this->report[$fileCode])) {
            $this->report[$fileCode] = [];
        }

        foreach($file->getValidationReport() as /* @var ValidationReportEntry */ $entry) {
            $this->report[$fileCode][] = $entry;
        }
    }


    private function report(string $level, string $text, ?File $file = null) {

        $fileCode = $file ? "{$file->getType()}/{$file->getName()}" : '.';

        if (!isset($this->report[$fileCode])) {
            $this->report[$fileCode] = [];
        }

        $this->report[$fileCode][] = new ValidationReportEntry($level, $text);
    }


    private function findUnusedItems() {

        foreach (['Resource', 'Unit', 'Booklet'] as $type) {

            foreach($this->allFiles[$type] as /* @var File */ $file) {
                if (!$file->isUsed()) {
                    $file->report('warning', "$type is never used");
                }
            }
        }
    }


    private function countTestTakers() {

        $count = 0;
        foreach ($this->allFiles['Testtakers'] as $testtakersFile) {

            /* @var XMLFileTesttakers $testtakersFile */
            if ($testtakersFile->isValid()) {
                $count += $testtakersFile->getTesttakerCount();
            }
        }
        $this->report('info', "`$count` valid testtaker-logins found");
    }
}

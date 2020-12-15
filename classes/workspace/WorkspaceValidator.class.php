<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class WorkspaceValidator extends Workspace {

    private array $allFiles = [];
    private array $report = [];


    function __construct(int $workspaceId) {

        parent::__construct($workspaceId);
        $this->readFiles();
    }


    function validate(): array {
        $this->crossValidate();
        $this->findUnusedItems();
        $this->countTestTakers();
        return $this->report;
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


    private function findUnusedItems() {

        foreach (['Resource', 'Unit', 'Booklet'] as $type) {

            foreach($this->allFiles[$type] as /* @var File */ $file) {
                if (!$file->isUsed()) {
                    $this->report('warning', "$type is never used", $file);
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

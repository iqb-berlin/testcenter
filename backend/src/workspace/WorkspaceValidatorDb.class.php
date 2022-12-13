<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class WorkspaceValidatorDb extends WorkspaceValidator {

    public function getFiles(): array {

        return $this->workspace->workspaceDAO->getFiles($this->getId(), $this->workspace->getWorkspacePath());
    }


    // TODO !
    public function findDuplicates(File $ofFile): array {


        return [];
    }


    function findUnusedItems(): void {
        // TODO: Implement findUnusedItems() method.
    }



    protected function crossValidate(): void {
        // TODO: Implement crossValidate() method.
    }


    public function getResource(string $resourceId, bool $ignoreMinorAndPatchVersion): ?ResourceFile {

        if ($ignoreMinorAndPatchVersion) {
            return $this->workspace->workspaceDAO->getFile($this->getId(), $resourceId, 'Resource');
        } else {
            return $this->workspace->workspaceDAO->getFileSimilarVersion($this->getId(), $resourceId, 'Resource');
        }
    }


    public function getUnit(string $unitId): ?XMLFileUnit {

        return $this->workspace->workspaceDAO->getFile($this->getId(), $unitId, 'Unit');
    }


    public function getBooklet(string $bookletId): ?XMLFileBooklet {

        return $this->workspace->workspaceDAO->getFile($this->getId(), $bookletId, 'Booklet');
    }


    public function getSysCheck(string $sysCheckId): ?XMLFileSysCheck {

        return $this->workspace->workspaceDAO->getFile($this->getId(), $sysCheckId, 'SysCheck');
    }


    public function addFile(string $type, File $file, $overwriteAllowed = false): string {

        return "TODO";
    }

    protected function fullReport(): array {
        // TODO: Implement fullReport() method.
        return [];
    }
}

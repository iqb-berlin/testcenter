<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


abstract class WorkspaceValidator {

    protected Workspace $workspace;
    protected array $globalIds = []; // type => [id => fileName]

    function __construct(Workspace $workspace) {

        $this->workspace = $workspace;
        $this->setGlobalIds();
    }


    public function validate(): array {

        $this->crossValidate();
        $this->findUnusedItems();

        return $this->fullReport();
    }


    public function getId(): int {

        return $this->workspace->getId();
    }


    abstract protected function fullReport(): array;


    private function setGlobalIds() {

        $this->globalIds = $this->workspace->workspaceDAO->getGlobalIds();
    }


    public function getGlobalIds(): array {

        return $this->globalIds;
    }


    abstract public function findDuplicates(File $ofFile): array;

    abstract function findUnusedItems(): void;

    abstract protected function crossValidate(): void;

    abstract public function getFiles(): array;

    abstract public function getResource(string $resourceId, bool $ignoreMinorAndPatchVersion): ?ResourceFile;

    abstract public function getUnit(string $unitId): ?XMLFileUnit;

    abstract public function getBooklet(string $bookletId): ?XMLFileBooklet;

    abstract public function getSysCheck(string $sysCheckId): ?XMLFileSysCheck;

    abstract public function addFile(string $type, File $file, $overwriteAllowed = false): string;
}

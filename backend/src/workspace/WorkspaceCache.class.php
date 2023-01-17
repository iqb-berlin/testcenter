<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class WorkspaceCache {

    protected array $cachedFiles = [];
    protected array $versionMap = [];
    protected Workspace $workspace;
    protected array $globalIds = []; // type => [id => fileName]

    function __construct(Workspace $workspace) {

        $this->workspace = $workspace;
        $this->setGlobalIds();
        $this->initializeFilesArray();
    }

    public function getId(): int {

        return $this->workspace->getId();
    }


    public function getFiles(bool $flat = false): array {

        if (!$flat) {

            return $this->cachedFiles; // TODO! special folderZ
        }

        $files = [];

        foreach ($this->cachedFiles as $fileSet) {

            foreach ($fileSet as /** @var File */ $file) {

                $files[$file->getPath()] = $file;
            }
        }

        return $files;
    }


    // TODO unit-test
    public function findDuplicates(File $ofFile): array {

        $files = [];

        foreach ($this->cachedFiles as $type => $fileList) {

            if (!str_starts_with($type, $ofFile->getType())) {
                continue;
            }

            foreach ($fileList as $id => $file) {

                if (($id === $ofFile->getId()) and ($file->getName() !== $ofFile->getName())) {

                    $files[] = $file;
                }
            }
        }

        return $files;
    }


    public function getResource(string $resourceId, bool $allowSimilarVersion): ?ResourceFile {

        if ($allowSimilarVersion or !isset($this->cachedFiles['Resource'][$resourceId])) {

            try {

                $resource = $this->workspace->getFileById('Resource', $resourceId, $allowSimilarVersion);
                /* @var $resource ResourceFile */
                return $resource;

            } catch(HttpError $exception) {

                return null;
            }

        }

        return $this->cachedFiles['Resource'][$resourceId] ?? null;
    }


    public function getUnit(string $unitId): ?XMLFileUnit {

        return $this->cachedFiles['Unit'][$unitId] ?? null;
    }


    public function getBooklet(string $bookletId): ?XMLFileBooklet {

        return $this->cachedFiles['Booklet'][$bookletId] ?? null;
    }


    public function getSysCheck(string $sysCheckId): ?XMLFileSysCheck {

        return $this->cachedFiles['SysCheck'][$sysCheckId] ?? null;
    }


    private function getFileById(string $type, string $fileId, bool $allowSimilarVersion = false): ?File {

        if (!$allowSimilarVersion and isset($this->cachedFiles[$type][$fileId])) {

            return $this->workspace->getFileById($type, $fileId, $allowSimilarVersion);
        }

        return $this->cachedFiles[$type][$fileId] ?? null;
    }


    public function addFile(string $type, File $file, $overwriteAllowed = false): string {

        if (isset($this->cachedFiles[$type][$file->getId()])) {

            $duplicate = $this->cachedFiles[$type][$file->getId()];

            if (!$overwriteAllowed or ($file->getName() !== $duplicate->getName())) {

                $type = $this->getPseudoTypeForDuplicate($type, $file->getId());
            }
        }

        $this->cachedFiles[$type][$file->getId()] = $file;

        if ($file->getType() == 'Resource') {

            $this->versionMap[FileName::normalize($file->getId(), true)] = $file->getId();
        }

        return "$type/{$file->getId()}";
    }


    protected function getPseudoTypeForDuplicate(string $type, string $id): string {

        $i = 2;
        while (isset($this->cachedFiles["$type/duplicates/$id/$i"])) {
            $i++;
        }
        return "$type/duplicates/$id/$i";
    }


    public function markUnusedItems(): void {

        $relationsMap = [];

        foreach (Workspace::subFolders as $type) {

            foreach ($this->cachedFiles[$type] as $file) {

                /* @var $file File */
                if ($file::canBeRelationSubject) {

                    $relations = $file->getRelations();
                    foreach ($relations as $relation) {

                        /* @var FileRelation $relation */
                        $relationsMap[$relation->getTargetType()][$relation->getTargetRequest()] = $relation;
                    }
                }
            }
        }

        foreach (Workspace::subFolders as $type) {

            foreach($this->cachedFiles[$type] as $file) { /* @var $file File */

                if ($file::canBeRelationObject and !isset($relationsMap[$file->getType()][$file->getId()])) {

                    $file->report('warning', "{$file->getType()} is never used");
                }
            }
        }
    }

    private function setGlobalIds(): void {

        $this->globalIds = $this->workspace->workspaceDAO->getGlobalIds();
    }


    public function getGlobalIds(): array {

        return $this->globalIds;
    }

    private function initializeFilesArray(): void {

        foreach (Workspace::subFolders as $type) {

            $this->cachedFiles[$type] = [];
        }
    }
}

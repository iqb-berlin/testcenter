<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileUnit extends XMLFile {

    protected int $totalSize = 0;
    protected string $playerId = '';
    protected array $usedBy = [];

    public function crossValidate(WorkspaceValidator $validator) : void {

        $this->setTotalSize($validator);
        $this->setPlayerId($validator);
    }


    public function setTotalSize(WorkspaceValidator $validator): void {

        $this->totalSize = $this->size;

        $definitionRef = $this->getDefinitionRef();

        if (!$definitionRef) {
            return;
        }

        $resourceId = FileName::normalize($definitionRef, false);
        $resource = $validator->getResource($resourceId);
        if ($resource != null) {
            $resource->addUsedBy($this);
            $this->totalSize += $resource->getSize();
        } else {
            $this->report('error', "definitionRef `$definitionRef` not found");
        }
    }


    public function getTotalSize(): int {

        return $this->totalSize;
    }


    public function setPlayerId(WorkspaceValidator $validator): void {

        if (!$this->isValid()) {
            return;
        }

        $playerId = strtoupper($this->getPlayer());

        if (substr($playerId, -5) != '.HTML') {
            $playerId = $playerId . '.HTML';
        }

        $playerId = FileName::normalize($playerId, false);

        $resource = $validator->getResource($playerId);

        if ($resource != null) {
            $resource->addUsedBy($this);
        } else {
            $this->report('error', "unit definition type `$playerId` not found"); // TODO better msg
        }

        $this->playerId = $playerId;
    }


    public function getPlayerId(): string {

        return $this->playerId;
    }


    public function addUsedBy(File $file): void {

        $this->usedBy[] = ($file);
    }


    public function isUsed(): bool {

        return count($this->usedBy) > 0;
    }


    private function getPlayer() {


        $definitionNode = $this->xmlfile->Definition[0];
        if (isset($definitionNode)) {
            $playerAttr = $definitionNode['player'];
            if (isset($playerAttr)) {
                return (string) $playerAttr;
            }
        } else {
            $definitionNode = $this->xmlfile->DefinitionRef[0];
            if (isset($definitionNode)) {
                $playerAttr = $definitionNode['player'];
                if (isset($playerAttr)) {
                    return (string) $playerAttr;
                }
            }
        }

        return '';
    }


    private function getDefinitionRef(): string {

        $myreturn = '';
        if ($this->isValid() and ($this->xmlfile != false) and ($this->rootTagName == 'Unit')) {
            $definitionNode = $this->xmlfile->DefinitionRef[0];
            if (isset($definitionNode)) {
                $rFilename = (string) $definitionNode;
                if (isset($rFilename)) {
                    $myreturn = $rFilename;
                }
            }
        }
        return $myreturn;
    }
}

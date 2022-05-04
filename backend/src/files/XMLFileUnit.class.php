<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileUnit extends XMLFile {

    const type = 'Unit';

    protected int $totalSize = 0;
    protected string $playerId = '';
    private array $dependencies = [];

    public function __construct(string $path, bool $validate = false, bool $isRawXml = false) {

        parent::__construct($path, $validate, $isRawXml);

        if ($this->isValid()) {
            $this->playerId = $this->readPlayerId();
            $this->dependencies = $this->readDependencies();
        }
    }

    public function crossValidate(WorkspaceValidator $validator) : void {

        parent::crossValidate($validator);

        $this->checkIfResourceExists($validator);
        $this->getPlayerIfExists($validator);
    }


    public function getPlayerIfExists(WorkspaceValidator $validator): ?ResourceFile {

        if (!$this->isValid()) {
            return null;
        }

        $resource = $validator->getResource($this->playerId, true);

        if ($resource != null) {
            $resource->addUsedBy($this);
        } else {
            $this->report('error', "No suitable version of `{$this->playerId}` found");
        }

        return $resource;
    }


    private function checkIfResourceExists(WorkspaceValidator $validator): void {

        $this->totalSize = $this->size;

        $definitionRef = $this->getDefinitionRef();

        if (!$definitionRef) {
            return;
        }

        $resourceId = FileName::normalize($definitionRef, false);
        $resource = $validator->getResource($resourceId, false);
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

    public function getPlayerId(): string {

        return $this->playerId;
    }

    public function readPlayerId(): string {

        if (!$this->isValid()) {
            return '';
        }

        $definition = $this->xml->xpath('/Unit/Definition | /Unit/DefinitionRef');
        if (count($definition)) {
            $playerId = strtoupper((string) $definition[0]['player']);
            if (substr($playerId, -5) != '.HTML') {
                $playerId = $playerId . '.HTML';
            }
            return $playerId;
        }

        return '';
    }


    public function getContent(WorkspaceValidator $workspaceValidator): string {

        $this->crossValidate($workspaceValidator);
        if (!$this->isValid()) {
            return '';
        }

        $definitionNode = $this->xml->xpath('/Unit/Definition');
        if (count($definitionNode)) {
            return (string) $definitionNode[0];
        }

        $definitionRef = (string) $this->xml->xpath('/Unit/DefinitionRef')[0];
        $unitContentFile = $workspaceValidator->getResource($definitionRef, true);

        if (!$unitContentFile) {
            throw new HttpError("Resource not found: `$definitionRef`");
        }

        return $unitContentFile->getContent();
    }


    public function getDefinitionRef(): string {

        $definitionRefNodes = $this->xml->xpath('/Unit/DefinitionRef');
        return count($definitionRefNodes) ? (string) $definitionRefNodes[0] : '';
    }


    public function getDefinition(): string {

        $definitionNodes = $this->xml->xpath('/Unit/Definition');
        return count($definitionNodes) ? (string) $definitionNodes[0] : '';
    }


    public function getSpecialInfo(): FileSpecialInfo {

        $meta = parent::getSpecialInfo();
        $meta->totalSize = $this->getTotalSize();
        return $meta;
    }

    public function getDependencies(): array {

        return $this->dependencies;
    }

    private function readDependencies(): array {

        if (!$this->isValid()) {
            return [];
        }

        return array_map(
            function($e) { return (string) $e;},
            $this->xml->xpath('/Unit/Dependencies/Package')
        );
    }
}

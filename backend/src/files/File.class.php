<?php
declare(strict_types=1);

class File extends FileData {

    private const type = 'file';
    public const canBeRelationSubject = false;
    public const canBeRelationObject = false;
    protected string $name = '';

    static function get(string | FileData $init, string $type = null, bool $validate = false): File {

        if (!$type) {
            $type = File::determineType($init);
        }

        return match ($type) {
            'Testtakers' => new XMLFileTesttakers($init, $validate),
            'SysCheck' => new XMLFileSysCheck($init, $validate),
            'Booklet' => new XMLFileBooklet($init, $validate),
            'Unit' => new XMLFileUnit($init, $validate),
            'Resource' => new ResourceFile($init, $validate),
            'xml' => new XMLFile($init, $validate),
            default => new File($init, $type),
        };
    }


    // TODO unit-test
    private static function determineType(string $path): string {

        if (strtoupper(substr($path, -4)) == '.XML') {
            $asGenericXmlFile = new XMLFile($path, false);
            if (!in_array($asGenericXmlFile->rootTagName, XMLFile::knownRootTags)) {
                return 'xml';
            }
            return $asGenericXmlFile->rootTagName;
        } else {
            return 'Resource';
        }
    }


    public function __construct(string | FileData $init, string $type = null) {

        if (is_a($init, FileData::class)) {

            $this->path = $init->path;
            $this->type = $init->type;
            $this->id = $init->id;
            $this->label = $init->label;
            $this->description = $init->description;
            $this->validationReport = $init->validationReport;
            $this->relations = $init->relations;
            $this->modificationTime = $init->modificationTime;
            $this->size = $init->size;
            $this->name = basename($init->path);
            $this->contextData = $init->contextData;
            $this->veronaModuleType = $init->veronaModuleType;
            $this->veronaModuleId = $init->veronaModuleId;
            $this->versionMayor = $init->versionMayor;
            $this->versionMinor = $init->versionMinor;
            $this->versionPatch = $init->versionPatch;
            $this->versionLabel = $init->versionLabel;
            $this->veronaVersion = $init->veronaVersion;
            return;
        }

        parent::__construct(); // TODO! whats this?!

        $this->type = $type;

        $this->setFilePath($init);

        $this->id = FileName::normalize($this->getName());

        if (strlen($this->getName()) > 120) {
            $this->report('error', "Filename too long!");
        }
    }


    public function setFilePath(string $path): void {

        $this->path = $path;

        if (!file_exists($path)) {

            $this->size = 0;
            $this->name = '';
            $this->modificationTime = 0;
            $this->report('error', "file does not exist `" . dirname($path) . '/'. basename($path) . "`");

        } else {

            $this->size = filesize($path);
            $this->name = basename($path);
            $this->modificationTime = FileTime::modification($path);
        }
    }


    public function getType(): string {

        return $this->type ?? $this::type;
    }


    public function getName(): string {

        return $this->name;
    }


    public function getVersion(): string {

        return Version::asString($this->versionMayor, $this->versionMinor, $this->versionPatch, $this->versionLabel) ?? '';
    }


    public function getVersionMayorMinor(): string {

        return "{$this->versionMayor}.{$this->versionMinor}";
    }


    public function isValid(): bool {

        return count($this->validationReport['error'] ?? []) == 0;
    }


    public function report(string $level, string $message): void {

        $this->validationReport[$level][] = $message;
    }


    // TODO unit-test
    public function crossValidate(WorkspaceCache $workspaceCache): void {

        if ($duplicateId = $workspaceCache->getDuplicateId($this)) {

            $this->report('error', "Duplicate {$this->getType()}-Id: `{$this->getId()}`");
            $this->id = $duplicateId;
        }
    }


    public function getErrorString(): string {

        return implode(", ", $this->validationReport['error']);
    }


    public function addRelation(FileRelation $relation): void {

        $this->relations[] = $relation;
    }


    public function jsonSerialize(): mixed {

        $info = [
            'label' => $this->getLabel(),
            'description' => $this->getDescription(),
        ];
        if ($this->veronaModuleType) {
            $info['veronaModuleType'] = $this->veronaModuleType;
            $info['veronaVersion'] = $this->veronaVersion;
            $info['version'] = $this->getVersion();
        }

        $output = [
            'name' => $this->name,
            'size' => $this->size,
            'modificationTime' => $this->modificationTime,
            'type' => $this->type,
            'id' => $this->id,
            'report' => $this->validationReport,
            'info' => array_merge($info, $this->getContextData()
            ),
        ];

        return $output;
    }


    // TODO! wird ganz oft aufgerufen bei resource ZB!
    public function getContent(): string {

        if ($this->isValid()) { // does it even exist?
            return file_get_contents($this->path);
        }
        return "";
    }
}


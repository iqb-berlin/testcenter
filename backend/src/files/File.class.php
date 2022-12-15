<?php
declare(strict_types=1);

class File extends FileData {

    private const type = 'file';
    public const canHaveDependencies = true;
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
            if (!in_array($asGenericXmlFile->rootTagName, XMLFile::knownTypes)) {
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
            $this->specialInfo = $init->getSpecialInfo();
            $this->contextData = $init->getContextData();
            return;
        }

        parent::__construct();

        $this->type = $type;

        $this->setFilePath($init);

        $this->id = FileName::normalize($this->getName(), false);

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


    public function isValid(): bool {

        return count($this->validationReport['error'] ?? []) == 0;
    }


    public function report(string $level, string $message): void {

        $this->validationReport[$level][] = $message;
    }


    // TODO unit-test
    public function crossValidate(WorkspaceValidator $validator): void {

        $duplicates = $validator->findDuplicates($this);

        if (count($duplicates)) {

            $duplicateNames = implode(', ', array_map(function(File $file): string {
                return "`{$file->getName()}`";
            }, $duplicates));
            $this->report('error', "Duplicate {$this->getType()}-Id: `{$this->getId()}` ({$duplicateNames})");
        }
    }


    public function getErrorString(): string {

        return implode(", ", $this->validationReport['error']);
    }


    public function addRelation(FileRelation $relation): void {

        $this->relations[] = $relation;
    }
}


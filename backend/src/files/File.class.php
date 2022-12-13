<?php
declare(strict_types=1);

class File extends FileData {

    private const type = 'file';
    public const canHaveDependencies = true;
    protected string $name = '';
    protected ?array $usedBy = [];


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

        return count($this->getErrors()) == 0;
    }


    public function report(string $level, string $message): void {

        $this->validationReport[] = new ValidationReportEntry($level, $message);
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

    public function getValidationReport(): array {

        return $this->validationReport;
    }


    // TODO maybe store report sorted by level at the first time
    // TODO unit-test
    public function getValidationReportSorted(): array {

        return array_reduce(
            $this->getValidationReport(),
            function(array $carry, ValidationReportEntry $a) {
                $carry[$a->level][] = $a->message;
                return $carry;
            },
            []
        );
    }


    public function getErrors(): array {

        return array_filter($this->validationReport, function($validationReportEntry): bool {
            return $validationReportEntry->level == 'error';
        });
    }


    public function getErrorString(): string {

        return implode(", ", array_map(function (ValidationReportEntry $entry): string {
            return "[{$entry->level}] {$entry->message}";
        }, $this->getErrors()));
    }


    public function getSpecialInfo(): FileSpecialInfo {

        $info = new FileSpecialInfo([]);
        if ($this->getDescription()) {
            $info->description = $this->getDescription();
        }
        if ($this->getLabel()) {
            $info->label = $this->getLabel();
        }
        return $info;
    }


    public function addRelation(FileRelation $dependency): void {

        $this->relations[] = $dependency;
    }


    public function addUsedBy(File $file): void {

        if (!$this::canHaveDependencies) {
            return;
        }

        if (!in_array($file, $this->usedBy)) {

            $this->usedBy["{$file->getType()}/{$file->getName()}"] = $file;
        }
    }


    public function isUsed(): bool {

        return count($this->usedBy) > 0;
    }


    public function getUsedBy(): array {

        if (!$this::canHaveDependencies) {
            return [];
        }

        $depending = [];
        foreach ($this->usedBy as $localPath => /*+ @var File */ $file) {
            $depending[$localPath] = $file;
            $depending = array_merge($depending, $file->getUsedBy());
        }
        return $depending;
    }
}

<?php
declare(strict_types=1);

class File extends DataCollectionTypeSafe {

    private const type = 'file';
    private ?string $type;
    protected string $path = '';
    protected string $name = '';
    protected int $size = 0;
    protected int $modificationTime = 0;
    protected string $id = '';
    protected array $validationReport = [];


    static function get(string $path, string $type = null, bool $validate = false): File {

        if (!$type) {
            $type = File::determineType($path);
        }

        switch ($type) {
            case 'Testtakers': return new XMLFileTesttakers($path, $validate);
            case 'SysCheck': return new XMLFileSysCheck($path, $validate);
            case 'Booklet': return new XMLFileBooklet($path, $validate);
            case 'Unit': return new XMLFileUnit($path, $validate);
            case 'Resource': return new ResourceFile($path);
            case 'xml': return new XMLFile($path, $validate);
        }

        return new File($path, $type);
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


    public function __construct(string $path, string $type = null) {

        $this->path = $path;
        $this->type = $type;

        if (!file_exists($path)) {

            $this->report('error', "file does not exist `" . dirname($path) . '/'. basename($path) . "`");

        } else {

            $this->size = filesize($path);
            $this->name = basename($path);
            $this->modificationTime = filemtime($path);
            $this->id = FileName::normalize($this->getName(), false);
        }
    }


    public function getType(): string {

        return $this->type ?? $this::type;
    }


    public function getPath(): string {

        return $this->path;
    }


    public function getName(): string {

        return $this->name;
    }


    public function getSize() {

        return $this->size;
    }


    public function getId() {

        return $this->id;
    }


    public function getModificationTime() {

        return $this->modificationTime;
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

        return array_filter($this->validationReport, function(ValidationReportEntry $validationReportEntry): bool {
            return $validationReportEntry->level == 'error';
        });
    }


    public function getErrorString(): string {

        return implode(", ", array_map(function (ValidationReportEntry $entry): string {
            return "[{$entry->level}] {$entry->message}";
        }, $this->getErrors()));
    }


    public function getSpecialInfo(): array {

        return [];
    }
}

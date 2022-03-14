<?php
declare(strict_types=1);

class File extends DataCollectionTypeSafe {

    private const type = 'file';
    public const canHaveDependencies = true;
    protected ?string $type;
    protected string $path = '';
    protected string $name = '';
    protected int $size = 0;
    protected int $modificationTime = 0;
    protected string $id = '';
    protected array $validationReport = [];
    protected string $label = '';
    protected string $description = '';
    private ?array $usedBy = [];

    static function get(string $path, string $type = null, bool $validate = false, string $content = ''): File {

        if (!$type) {
            $type = File::determineType($path, $content);
        }

        $isRawXml = false;

        if ($content) {

            $isRawXml = true;
            $path = $content;
        }


        switch ($type) {
            case 'Testtakers': return new XMLFileTesttakers($path, $validate, $isRawXml);
            case 'SysCheck': return new XMLFileSysCheck($path, $validate, $isRawXml);
            case 'Booklet': return new XMLFileBooklet($path, $validate, $isRawXml);
            case 'Unit': return new XMLFileUnit($path, $validate, $isRawXml);
            case 'Resource': return new ResourceFile($path, $validate);
            case 'xml': return new XMLFile($path, $validate, $isRawXml);
        }

        return new File($path, $type);
    }


    // TODO unit-test
    private static function determineType(string $path, string $content = ''): string {

        if (strtoupper(substr($path, -4)) == '.XML') {
            $asGenericXmlFile = new XMLFile(empty($content) ? $path : $content, false, !!$content);
            if (!in_array($asGenericXmlFile->rootTagName, XMLFile::knownTypes)) {
                return 'xml';
            }
            return $asGenericXmlFile->rootTagName;
        } else {
            return 'Resource';
        }
    }


    public function __construct(string $path, string $type = null) {

        $this->type = $type;
        $this->setFilePath($path);
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


    public function getPath(): string {

        return $this->path;
    }


    public function getName(): string {

        return $this->name;
    }


    public function getSize(): int {

        return $this->size;
    }


    public function getId(): string {

        return $this->id;
    }


    public function getModificationTime(): int {

        return $this->modificationTime;
    }


    public function getLabel(): string {

        return $this->label;
    }


    public function getDescription(): string {

        return $this->description;
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

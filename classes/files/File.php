<?php
declare(strict_types=1);

class File extends DataCollectionTypeSafe {

    const type = 'file';
    protected string $path = '';
    protected string $name = '';
    protected int $size = 0;
    protected string $filedate;
    protected string $id = '';

    protected array $validationReport = [];


    static function get(string $type, string $path, bool $validate = false): File {

        switch ($type) {
            case 'Testtakers': return new XMLFileTesttakers($path, $validate);
            case 'SysCheck': return new XMLFileSysCheck($path, $validate);
            case 'Booklet': return new XMLFileBooklet($path, $validate);
            case 'Unit': return new XMLFileUnit($path, $validate);
            case 'Resource': return new ResourceFile($path, true);
        }

        throw new Exception("Filetype `$type` unknown!");
    }


    public function __construct(string $path) {

        $this->path = $path;
        if (!file_exists($path)) {

            $this->report('error', "file does not exist `" . dirname($path) . '/'. basename($path) . "`");

        } else {

            $this->size = filesize($path);
            $this->name = basename($path);
            $this->filedate = date(DATE_ATOM, filemtime($path));
            $this->id = FileName::normalize($this->getName(), false); // TODO versioning?
        }
    }


    public function report(string $level, string $message): void {

        $this->validationReport[] = new ValidationReportEntry($level, $message);
    }


    public function getValidationReport(): array {

        return $this->validationReport;
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


    public function isValid(): bool {

        return count($this->getErrors()) == 0;
    }


    public function getId() {

        return $this->id;
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
}

<?php
declare(strict_types=1);

class File extends DataCollectionTypeSafe {

    protected string $path = '';
    protected string $name = '';
    protected int $size = 0;
    protected string $filedate;
    protected string $id = '';

    protected array $validationReport = [];

    public function __construct(string $path) {
        $this->path = $path;
        if (!file_exists($path)) {
            $this->report('error', "file does not exist `" . dirname($path) . '/'. basename($path) . "`");
        } else {
            $this->size = filesize($path);
            $this->name = basename($path);
            $this->filedate = date(DATE_ATOM, filemtime($path));
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
}

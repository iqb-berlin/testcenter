<?php
declare(strict_types=1);

class ValidationReportEntry extends DataCollectionTypeSafe {

    public string $level = 'info';
    public string $message = '';

    public function __construct(string $level, string $message) {

        $this->level = $level;
        $this->message = $message;
    }
}

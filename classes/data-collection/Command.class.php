<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Command extends DataCollectionTypeSafe {

    protected $id = -1;
    protected $keyword = "";
    protected $arguments = [];
    protected $timestamp = -1;

    function __construct(int $id, string $keyword, int $timestamp, ...$arguments) {

        $this->id = $id;
        $this->keyword = $keyword;
        $this->timestamp = $timestamp;
        $this->arguments = array_map(function($arg) {return (string) $arg;}, $arguments);
    }

    public function getId(): int {

        return $this->id;
    }

    public function getKeyword(): string {

        return $this->keyword;
    }

    public function getArguments(): array {

        return $this->arguments;
    }

    public function getTimestamp(): int {

        return $this->timestamp;
    }
}

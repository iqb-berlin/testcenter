<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Command extends DataCollectionTypeSafe {

    protected $id = "";
    protected $keyword = "";
    protected $arguments = [];

    function __construct($id, $keyword, ...$arguments) {

        $this->id = $id;
        $this->keyword = $keyword;
        $this->arguments = array_map(function($arg) {return (string) $arg;}, $arguments);
    }

    public function getId(): string {

        return $this->id;
    }

    public function getKeyword(): string {

        return $this->keyword;
    }

    public function getArguments(): array {

        return $this->arguments;
    }
}

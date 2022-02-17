<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Group extends DataCollectionTypeSafe {

    protected $label = '';
    protected $name = '';

    function __construct(string $name, string $label) {

        $this->label = $label;
        $this->name = $name;
    }


    public function getLabel(): string {

        return $this->label;
    }


    public function getName(): string {

        return $this->name;
    }
}

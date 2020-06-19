<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class Group extends DataCollectionTypeSafe {

    protected $label = '';
    protected $name = '';

    protected $_members;

    function __construct(string $name, string $label, PotentialLogin ...$members) {

        $this->label = $label;
        $this->name = $name;

        $this->_members = new PotentialLoginArray(...$members);
    }


    public function getLabel(): string {

        return $this->label;
    }


    public function getName(): string {

        return $this->name;
    }


    public function getMembers(): PotentialLoginArray {

        return $this->_members;
    }
}

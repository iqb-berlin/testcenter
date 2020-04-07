<?php


class AccessObject extends DataCollectionTypeSafe {

    protected $id;
    protected $name;

    public function __construct(int $id, string $name) {

        $this->id = $id;
        $this->name = $name;
    }
}

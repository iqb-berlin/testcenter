<?php


class AccessObject extends DataCollection2 {

    protected $id;
    protected $name;
    protected $enabled = true;

    public function __construct(int $id, string $name, bool $enabled = false) {

        $this->id = $id;
        $this->name = $name;
        $this->enabled = $enabled;
    }
}

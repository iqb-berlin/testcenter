<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class AccessObject extends DataCollectionTypeSafe {
    protected string $id;
    protected string $type;
    protected string $label;
    protected array $flags;

    public function __construct(string $id, string $type, string $label, array $flags = []) {

        $this->id = $id;
        $this->type = $type;
        $this->label = $label;
        $this->flags = $flags;
    }


    public function getLabel(): string {
        return $this->label;
    }


    public function getId(): string {
        return $this->id;
    }


    public function getType(): string {

        return $this->type;
    }


    public function getFlags(): array {

        return $this->flags;
    }
}
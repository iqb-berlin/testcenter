<?php

class FileData extends DataCollectionTypeSafe {

    protected string | null $type;
    protected string $path = '';
    protected string $id = '';
    protected string $label = '';
    protected string $description = '';

    public function __construct(
        string $path = '',
        string $type = null,
        string $id = '',
        string $label = '',
        string $description = ''
    ) {
        $this->type = $type;
        $this->path = $path;
        $this->id = $id;
        $this->label = $label;
        $this->description = $description;
    }


    public function getType(): string {

        return $this->type;
    }


    public function getPath(): string {

        return $this->path;
    }


    public function getSize(): int {

        return $this->size;
    }


    public function getId(): string {

        return $this->id;
    }


    public function getLabel(): string {

        return $this->label;
    }


    public function getDescription(): string {

        return $this->description;
    }
}
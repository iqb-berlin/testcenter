<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class WorkspaceData extends DataCollectionTypeSafe {

    private int $id;
    private string $name;
    private string $mode;

    function __construct(
        int $id,
        string $name,
        string $mode
    ) {

        $this->id = $id;
        $this->name = $name;
        $this->mode = $mode;
        // TODO check if valid mode
    }


    public function getId(): int {

        return $this->id;
    }


    public function getName(): string {

        return $this->name;
    }


    public function getMode(): string {

        return $this->mode;
    }
}
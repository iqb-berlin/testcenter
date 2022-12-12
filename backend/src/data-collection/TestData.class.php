<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class TestData extends DataCollectionTypeSafe {

    private string $bookletId;
    private string $label;
    private string $description;
    private bool $locked;
    private bool $running;

    function __construct(
        string $bookletId,
        string $label,
        string $description,
        bool $locked,
        bool $running
    ) {
        $this->bookletId = $bookletId;
        $this->label = $label;
        $this->description = $description;
        $this->locked = $locked;
        $this->running = $running;
    }


    public function getBookletId(): string {

        return $this->bookletId;
    }


    public function getLabel(): string {
        return $this->label;
    }


    public function getDescription(): string {

        return $this->description;
    }


    public function isLocked(): bool {

        return $this->locked;
    }


    public function isRunning(): bool {

        return $this->running;
    }
}

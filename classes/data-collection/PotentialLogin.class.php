<?php

/** @noinspection PhpUnhandledExceptionInspection */


class PotentialLogin extends DataCollection2 {

    protected $name = "";
    protected $mode = "";
    protected $groupName = "";
    protected $booklets = [];
    protected $workspaceId = 0;

    protected $validFrom = 0;
    protected $validTo = 0;
    protected $validForMinutes = 0;

    protected $customTexts; // TODO after https://github.com/iqb-berlin/testcenter-iqb-php/issues/53 make null


    function __construct(
        string $name,
        string $mode,
        string $groupName,
        array $booklets,
        int $workspaceId,
        int $validTo,
        int $validFrom = 0,
        int $validForMinutes = 0,
        $customTexts = null
    ) {

        $this->name = $name;
        $this->mode = $mode;
        $this->groupName = $groupName;
        $this->booklets = $booklets;
        $this->workspaceId = $workspaceId;
        $this->validFrom = $validFrom;
        $this->validTo = $validTo;
        $this->validForMinutes = $validForMinutes;
        $this->customTexts = $customTexts ?? new stdClass();
    }
    

    public function getName(): string {
        
        return $this->name;
    }


    public function getMode(): string {
        
        return $this->mode;
    }


    public function getGroupName(): string {
        
        return $this->groupName;
    }


    public function getBooklets(): array {
        
        return $this->booklets;
    }
    
    
    public function getWorkspaceId(): int {
        return $this->workspaceId;
    }


    public function getValidFrom(): int {

        return $this->validFrom;
    }


    public function getValidTo(): int {

        return $this->validTo;
    }


    public function getValidForMinutes(): int {

        return $this->validForMinutes;
    }


    public function getCustomTexts(): ?stdClass {

        return $this->customTexts;
    }


    public function isCodeRequired(): bool {

        return (array_keys($this->booklets) != ['']);
    }
}

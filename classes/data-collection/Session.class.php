<?php

class Session extends DataCollectionTypeSafe {

    protected $token;
    protected $displayName;
    protected $customTexts;
    protected $flags;
    protected $access;

    public function __construct(
        string $token,
        string $displayName,
        array $flags = [],
        stdClass $customTexts = null
    ) {

        $this->token = $token;
        $this->displayName = $displayName;
        $this->flags = array_map(function($flag) {
            return (string) $flag;
        }, $flags);

        $this->access = new stdClass();

        $this->customTexts = $customTexts ?? (object) [];
    }

    public function setAccessWorkspaceAdmin(AccessObject ...$accessObjects) {

        $this->access->workspaceAdmin = $accessObjects;
    }

    public function setAccessSuperAdmin() {

        $this->access->superAdmin = [];
    }

    public function setAccessTest(AccessObject ...$accessObjects) {

        $this->access->test = $accessObjects;
    }

    public function getAccessWorkspaceAdmin(): ?array {

        return $this->access->workspaceAdmin ?? null;
    }

    public function getAccessSuperAdmin(): ?array {

        return $this->access->workspaceAdmin ?? null;
    }

    public function getAccessTest(): ?array {

        return $this->access->test ?? null;
    }
}

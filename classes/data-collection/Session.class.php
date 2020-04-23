<?php
/** @noinspection PhpUnhandledExceptionInspection */
// TODO unit-tests

class Session extends DataCollectionTypeSafe {

    static $accessObjectTypes = [
        'test',
        'superAdmin',
        'workspaceAdmin',
        'testMonitor',
        'workspaceMonitor'
    ];

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

    public function addAccessObjects(string $type, string ...$accessObjects): Session {

        if (!in_array($type, $this::$accessObjectTypes)) {

            throw new Exception("AccessObject type `$type` is not valid.");
        }

        $this->access->$type = $accessObjects;

        return $this;
    }

    public function hasAccess(string $type, string $id = null): bool {

        return isset($this->access->$type) and (!$id or in_array($id, $this->access->$type));
    }
}

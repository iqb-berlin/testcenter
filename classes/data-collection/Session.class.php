<?php
/** @noinspection PhpUnhandledExceptionInspection */

class Session extends DataCollectionTypeSafe {

    static $accessObjectTypes = [
        'test',
        'superAdmin',
        'workspaceAdmin',
        'testGroupMonitor',
        'workspaceMonitor'
    ];

    protected $token;
    protected $displayName;
    protected $customTexts;
    protected $flags;
    protected $access;


    // TODO add unit-test
    static function createFromLogin(Login $login, Person $person) {

        $session = new Session(
            $person->getToken(),
            "{$login->getGroupName()}/{$login->getName()}/{$person->getCode()}",
            [],
            $login->getCustomTexts() ?? new stdClass()
        );

        switch ($login->getMode()) {

            case "monitor-study":
                $session->addAccessObjects('workspaceMonitor', (string) $login->getWorkspaceId());
                break;

            case "monitor-group":
                $session->addAccessObjects('testGroupMonitor', (string) $login->getWorkspaceId());
                break;

            default:
                $personsBooklets = $login->getBooklets()[$person->getCode()] ?? [];
                $session->addAccessObjects('test', ...$personsBooklets);
                break;
        }

        return $session;
    }


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

        if (!$id) {
            return isset($this->access->$type);
        }

        if (!isset($this->access->$type)) {
            return false;
        }

        return in_array($id, $this->access->$type);
    }
}

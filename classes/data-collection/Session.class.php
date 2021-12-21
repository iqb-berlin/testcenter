<?php
/** @noinspection PhpUnhandledExceptionInspection */

class Session extends DataCollectionTypeSafe {

    static $accessObjectTypes = [
        'test',
        'superAdmin',
        'workspaceAdmin',
        'testGroupMonitor'
    ];

    protected $token;
    protected $displayName;
    protected $customTexts;
    protected $flags;
    protected $access;


    // TODO add unit-test
    static function createFromPersonSession(PersonSession $loginWithPerson): Session {

        $login = $loginWithPerson->getLoginSession()->getLogin();

        $session = new Session(
            $loginWithPerson->getPerson()->getToken(),
            "{$login->getGroupLabel()}/{$login->getName()}/{$loginWithPerson->getPerson()->getCode()}",
            [],
            $login->getCustomTexts() ?? new stdClass()
        );

        switch ($login->getMode()) {

            case "monitor-group":
                $session->addAccessObjects('testGroupMonitor', $login->getGroupName());
                break;

            default:
                $personsBooklets = $login->getBooklets()[$loginWithPerson->getPerson()->getCode()] ?? [];
                $session->addAccessObjects('test', ...$personsBooklets);
                break;
        }

        return $session;
    }


    static function createFromLoginSession(LoginSession $loginSession): Session {

        return new Session(
            $loginSession->getToken(),
            "{$loginSession->getLogin()->getGroupLabel()}/{$loginSession->getLogin()->getName()}",
            $loginSession->getLogin()->isCodeRequired() ? ['codeRequired'] : [],
            $loginSession->getLogin()->getCustomTexts()
        );
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

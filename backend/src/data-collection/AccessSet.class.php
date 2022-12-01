<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class AccessSet extends DataCollectionTypeSafe {

    static $accessObjectTypes = [
        'test',
        'superAdmin',
        'workspaceAdmin',
        'testGroupMonitor'
    ];

    protected string $token;
    protected string $displayName;
    protected object $customTexts;
    protected array $flags;
    protected array $access;


    // TODO add unit-test
    static function createFromPersonSession(PersonSession $loginWithPerson): AccessSet {

        $login = $loginWithPerson->getLoginSession()->getLogin();

        $displayName = "{$login->getGroupLabel()}/{$login->getName()}";
        $displayName .= $loginWithPerson->getPerson()->getNameSuffix() ? '/' . $loginWithPerson->getPerson()->getNameSuffix() : '';

        $accessSet = new AccessSet(
            $loginWithPerson->getPerson()->getToken(),
            $displayName,
            [],
            $login->getCustomTexts() ?? new stdClass()
        );

        switch ($login->getMode()) {

            case "monitor-group":
                $accessSet->addAccessObjects(
                    'testGroupMonitor',
                    new AccessObject(
                        $login->getGroupName(),
                        'testGroupMonitor',
                        $login->getGroupLabel()
                    )
                );
                break;

            default:
                $personsBooklets = $login->getBooklets()[$loginWithPerson->getPerson()->getCode()] ?? [];
                $personsBookletsAsAccessObjects = array_map(
                    function(string $bookletId): AccessObject {
                        return new AccessObject($bookletId, 'test', 'labelFor $bookletId');
                    },
                    $personsBooklets
                );
                $accessSet->addAccessObjects('test', ...$personsBookletsAsAccessObjects);
                break;
        }

        return $accessSet;
    }


    static function createFromLoginSession(LoginSession $loginSession): AccessSet {

        return new AccessSet(
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

        $this->access = [];

        $this->customTexts = $customTexts ?? (object) [];
    }


    public function addAccessObjects(string $type, AccessObject ...$accessObjects): AccessSet {

        if (!in_array($type, $this::$accessObjectTypes)) {

            throw new Exception("AccessObject type `$type` is not valid.");
        }

        $this->access[$type] = $accessObjects;

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

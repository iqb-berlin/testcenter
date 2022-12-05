<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class AccessSet extends DataCollectionTypeSafe {

    static $accessObjectTypes = [
        'test',
        'superAdmin',
        'workspaceAdmin',
        'testGroupMonitor',
        'attachmentManager'
    ];

    protected string $token;
    protected string $displayName;
    protected object $customTexts;
    protected array $flags;
    protected array $access;


    // TODO add unit-test
    static function createFromPersonSession(PersonSession $loginWithPerson): AccessSet {

        $login = $loginWithPerson->getLoginSession()->getLogin();

        $displayName = self::getDisplayName(
            $login->getGroupLabel(),
            $login->getName(),
            $loginWithPerson->getPerson()->getNameSuffix()
        );

        $accessSet = new AccessSet(
            $loginWithPerson->getPerson()->getToken(),
            $displayName,
            [],
            $login->getCustomTexts() ?? new stdClass()
        );

        $accessSet->addTests($loginWithPerson);

        if ($login->getMode() == "monitor-group") {
            if (str_starts_with($login->getGroupName(), 'experimental')) {
                $accessSet->addAccessObjects(
                    'attachmentManager',
                    new AccessObject(
                        $login->getGroupName(),
                        'attachmentManager',
                        $login->getGroupLabel()
                    )
                );
            }
            $accessSet->addAccessObjects(
                'testGroupMonitor',
                new AccessObject(
                    $login->getGroupName(),
                    'testGroupMonitor',
                    $login->getGroupLabel()
                )
            );
        }

        return $accessSet;
    }


    static function createFromAdminToken(string $adminToken): AccessSet {

        $adminDAO = new AdminDAO();
        $admin = $adminDAO->getAdmin($adminToken);

        $accessSet = new AccessSet(
            $adminToken,
            $admin['name']
        );

        $accessObjects = array_map(
            function($workspace): AccessObject {
                return new AccessObject(
                    (string) $workspace['id'],
                    'workspaceAdmin',
                    (string) $workspace['name'],
                    [ "mode" => $workspace["role"]]
                );
            },
            $adminDAO->getWorkspaces($adminToken)
        );

        $accessSet->addAccessObjects('workspaceAdmin', ...$accessObjects);

        if ($admin["isSuperadmin"]) {
            $accessSet->addAccessObjects('superAdmin');
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


    static function getDisplayName(string $groupLabel, string $loginName, ?string $nameSuffix): string {

        $displayName = "$groupLabel/$loginName";
        $displayName .= $nameSuffix ? '/' . $nameSuffix : '';
        return $displayName;
    }


    public function hasAccess(string $type, string $id = null): bool {

        if (!$id) {
            return isset($this->access[$type]);
        }

        if (!isset($this->access[$type])) {
            return false;
        }

        return in_array($id, $this->access[$type]);
    }


    private function addAccessObjects(string $type, AccessObject ...$accessObjects): AccessSet {

        if (!in_array($type, $this::$accessObjectTypes)) {

            throw new Exception("AccessObject type `$type` is not valid.");
        }

        $this->access[$type] = $accessObjects;

        return $this;
    }


    private function addTests(PersonSession $personSession): void {

        $workspaceDAO = new SessionDAO();
        $bookletsData = array_map(
            function (TestData $testData): AccessObject {
                return new AccessObject(
                    $testData->getBookletId(),
                    'test',
                    $testData->getLabel(),
                    [
                        'locked' => $testData->isLocked(),
                        'running' => $testData->isRunning()
                    ]
                );
            },
            $workspaceDAO->getTestsOfPerson($personSession)
        );
        $this->addAccessObjects('test', ...$bookletsData);
    }
}

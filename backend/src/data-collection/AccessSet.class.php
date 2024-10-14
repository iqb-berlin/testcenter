<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

// TODO add unit-tests

class AccessSet extends DataCollectionTypeSafe {

  protected string $token;
  protected string $displayName;
  protected object $customTexts;
  protected array $flags;
  protected object $claims;
  protected ?string $groupToken;

  static function createFromPersonSession(
    PersonSession $loginWithPerson,
    WorkspaceData|TestData|Group|SystemCheck ...$accessItems
  ): AccessSet {
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

    $accessSet->groupToken = $loginWithPerson->getLoginSession()->getGroupToken();

    foreach ($accessItems as $accessItem) {
      switch (get_class($accessItem)) {
        case 'WorkspaceData':
          if ($login->getMode() == 'monitor-study') {
            $accessSet->addStudyMonitor($accessItem);
          }
          break;
        case 'Group':
          $accessSet->addGroupMonitors($login, $accessItem);
          break;
        case 'TestData':
          $accessSet->addTests($accessItem);
          break;
        case 'SystemCheck':
          $accessSet->addSystemChecks($accessItem);
      }
    }

    if (($login->getMode() == 'monitor-group') and str_starts_with($login->getGroupName(), 'experimental')) {
      $accessSet->addAccessObjects(
        AccessObjectType::ATTACHMENT_MANAGER,
        new AccessObject($login->getGroupName(), AccessObjectType::ATTACHMENT_MANAGER, $login->getGroupLabel())
      );
    }

    return $accessSet;
  }

  static function createFromAdminToken(Admin $admin, WorkspaceData ...$workspaces): AccessSet {
    $accessSet = new AccessSet(
      $admin->getToken(),
      $admin->getName()
    );

    $accessObjects = array_map(
      function (WorkspaceData $workspace): AccessObject {
        return new AccessObject(
          (string) $workspace->getId(),
          AccessObjectType::WORKSPACE_ADMIN,
          $workspace->getName(),
          ["mode" => $workspace->getMode()]
        );
      },
      $workspaces
    );

    $accessSet->addAccessObjects(AccessObjectType::WORKSPACE_ADMIN, ...$accessObjects);

    if ($admin->isSuperadmin()) {
      $accessSet->addAccessObjects(AccessObjectType::SUPER_ADMIN);
    }

    return $accessSet;
  }

  static function createFromLoginSession(LoginSession $loginSession): AccessSet {
    return new AccessSet(
      $loginSession->getToken(),
      "{$loginSession->getLogin()->getGroupLabel()}/{$loginSession->getLogin()->getName()}",
      $loginSession->getLogin()->isCodeRequired() ? ['codeRequired'] : [],
      $loginSession->getLogin()->getCustomTexts(),
      $loginSession->getGroupToken()
    );
  }

  public function __construct(
    string $token,
    string $displayName,
    array $flags = [],
    stdClass $customTexts = null,
    ?string $groupToken = null
  ) {
    $this->token = $token;
    $this->displayName = $displayName;
    $this->flags = array_map(function ($flag) {
      return (string) $flag;
    }, $flags);

    $this->claims = (object) [];

    $this->customTexts = $customTexts ?? (object) [];

    $this->groupToken = $groupToken;
  }

  function jsonSerialize(): mixed {
    $json = parent::jsonSerialize();
    $deprecatedFormat = (object) [];
    foreach ($this->claims as $accessType => $accessObjectList) {
      $deprecatedFormat->$accessType = [];

      foreach ($accessObjectList as $accessObject) {
        /** @var $accessObject AccessObject */
        $deprecatedFormat->$accessType[] = $accessObject->id;
      }
    }
    $json['access'] = $deprecatedFormat;
    return $json;
  }

  static function getDisplayName(string $groupLabel, string $loginName, ?string $nameSuffix): string {
    $displayName = "$groupLabel/$loginName";
    $displayName .= $nameSuffix ? '/' . $nameSuffix : '';
    return $displayName;
  }

  public function hasAccessType(AccessObjectType $type): bool {
    $accessType = $type->value;
    return isset($this->claims->$accessType);
  }

  private function addAccessObjects(AccessObjectType $type, AccessObject ...$accessObjects): void {
    $accessType = $type->value;
    if (!isset($this->claims->$accessType)) {
      $this->claims->$accessType = [];
    }

    array_push($this->claims->$accessType, ...$accessObjects);
  }

  private function addTests(TestData ...$testsOfPerson): void {
    $bookletsData = array_map(
      function (TestData $testData): AccessObject {
        return new AccessObject(
          $testData->name,
          AccessObjectType::TEST,
          $testData->label,
          [
            'locked' => $testData->locked,
            'running' => $testData->running
          ]
        );
      },
      $testsOfPerson
    );
    $this->addAccessObjects(AccessObjectType::TEST, ...$bookletsData);
  }

  private function addGroupMonitors(Login $login, Group ...$groups): void {
    $profiles = $login->getProfiles();

    foreach ($groups as $group) {
      $flags = [];
      if ($group->_expired->type == ExpirationStateType::Expired) {
        $flags['expired'] = $group->_expired->timestamp * 1000;
      } else if ($group->_expired->type == ExpirationStateType::Scheduled) {
        $flags['scheduled'] = $group->_expired->timestamp * 1000;
      }
      if (count($profiles)) {
        foreach ($profiles as $profile) {
          $profileFlags = $flags;
          $profileFlags['profile'] = $profile['id'];
          $profileFlags['subLabel'] = $profile['label'];
          $this->addAccessObjects(
            AccessObjectType::TEST_GROUP_MONITOR,
            new AccessObject($group->name, AccessObjectType::TEST_GROUP_MONITOR, $group->label, $profileFlags)
          );
        }
      } else {
        $this->addAccessObjects(
          AccessObjectType::TEST_GROUP_MONITOR,
          new AccessObject($group->name, AccessObjectType::TEST_GROUP_MONITOR, $group->label, $flags)
        );
      }
    }
  }

  private function addStudyMonitor(WorkspaceData $accessItem): void {
    $this->addAccessObjects(
      AccessObjectType::STUDY_MONITOR,
      new AccessObject(
        (string) $accessItem->getId(),
        AccessObjectType::STUDY_MONITOR,
        $accessItem->getName()
      )
    );
  }

  private function addSystemChecks(SystemCheck ...$accessItems): void {
    $systemChecks = array_map(
      function (SystemCheck $systemCheck) {
        return new SystemCheckAccessObject(
          $systemCheck->getWorkspaceId(),
          $systemCheck->getId(),
          AccessObjectType::SYS_CHECK,
          $systemCheck->getLabel(),
          $systemCheck->getDescription()
        );
      },
      $accessItems
    );

    $this->addAccessObjects(AccessObjectType::SYS_CHECK, ...$systemChecks);
  }
}

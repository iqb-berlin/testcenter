<?php

/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);

class XMLFileTesttakers extends XMLFile {
  const string type = 'Testtakers';
  const bool canBeRelationSubject = true;
  const bool canBeRelationObject = false;
  protected LoginArray $logins;

  public function crossValidate(WorkspaceCache $workspaceCache): void {
    parent::crossValidate($workspaceCache);

    $this->logins = $this->getAllLogins();
    $this->contextData['testtakers'] = count($this->logins->asArray());

    foreach ($this->logins as $login) {
      /* @var Login $login */
      $this->checkIfBookletsArePresent($login, $workspaceCache);
    }

    $this->checkIfIdsAreUsedInOtherFiles($workspaceCache);
  }

  private function checkIfBookletsArePresent(Login $testtaker, WorkspaceCache $validator): void {
    foreach ($testtaker->testNames() as $code => $testNames) {
      foreach ($testNames as $testName) {
        $testName = TestName::fromString($testName);
        $bookletId = $testName->bookletFileId;
        $booklet = $validator->getBooklet($bookletId);

        if (!$booklet) {
          $this->report('error', "Booklet `$bookletId` not found for login `{$testtaker->getName()}`");
          continue;
        }

        if (!$booklet->isValid()) {
          $this->report('error', "Booklet `$bookletId` has an error for login `{$testtaker->getName()}`");
          continue;
        }

        $this->addRelation(new FileRelation($booklet->getType(), $bookletId, FileRelationshipType::hasBooklet, $booklet));

      }
    }
  }

  private function checkIfIdsAreUsedInOtherFiles(WorkspaceCache $workspaceCache): void {
    $loginList = $this->getAllLoginNames();
    $groupList = array_keys($this->getGroups());

    $workspaceCache->addGlobalIdSource($this->getName(), 'login', $loginList);
    $workspaceCache->addGlobalIdSource($this->getName(), 'group', $groupList);

    foreach ($workspaceCache->getGlobalIds() as $workspaceId => $sources) {
      foreach ($sources as $source => $globalIdsByType) {
        if ($source == '/name/') {
          continue;
        }
        if (($source == $this->getName()) and ($workspaceId == $workspaceCache->getId())) {
          continue;
        }

        $this->reportDuplicates(
          'login',
          array_intersect($loginList, array_values($globalIdsByType['login'])),
          $source,
          $workspaceCache->getId(),
          $workspaceId,
          $sources['/name/'] ?? 'unknown'
        );
        $this->reportDuplicates(
          'group',
          array_intersect($groupList, array_values($globalIdsByType['group'])),
          $source,
          $workspaceCache->getId(),
          $workspaceId,
          $sources['/name/'] ?? 'unknown'
        );
      }
    }
  }

  private function reportDuplicates(
    string $type,
    array $duplicates,
    string $otherFileName,
    int $thisWsId,
    int $otherWsId,
    string $workspaceName
  ): void {
    foreach ($duplicates as $duplicate) {
      $location = ($thisWsId !== $otherWsId) ? "on workspace `$workspaceName` " : '';
      $location .= "in file `$otherFileName`";
      $this->report('error', "Duplicate $type: `$duplicate` - also $location");
    }
  }

  public function getAllLogins(): LoginArray {
    if (!$this->isValid()) {
      return new LoginArray();
    }

    $testTakers = [];

    foreach ($this->getXml()->xpath('Group') as $groupElement) {
      foreach ($groupElement->xpath('Login[@name]') as $loginElement) {
        $login = $this->getLogin($groupElement, $loginElement, -1);
        $testTakers[] = $login;
      }
    }

    return new LoginArray(...$testTakers);
  }

  public function getAllLoginNames(): array {
    if (!$this->isValid()) {
      return [];
    }

    $loginNames = [];

    foreach ($this->getXml()->xpath('Group/Login[@name]') as $loginElement) {
      if (!in_array((string) $loginElement['name'], $loginNames)) {
        $loginNames[] = (string) $loginElement['name'];
      }
    }

    return $loginNames;
  }

  public function getGroups(): array {
    if (!$this->isValid()) {
      return [];
    }

    $groups = [];

    foreach ($this->getXml()->xpath('Group') as $groupElement) {
      $groups[(string) $groupElement['id']] = new Group(
        (string) $groupElement['id'],
        (string) $groupElement['label']
      );
    }

    return $groups;
  }

  public function getLoginsInSameGroup(string $loginName, int $workspaceId): ?LoginArray {
    if (!$this->isValid()) {
      return null;
    }

    foreach ($this->getXml()->xpath("Group[Login[@name='$loginName']]") as $groupElement) {
      $groupMembers = new LoginArray();

      foreach ($groupElement->xpath("Login[@name!='$loginName'][@mode!='monitor-group'][Booklet]") as $memberElement) {
        $groupMembers->add($this->getLogin($groupElement, $memberElement, $workspaceId));
      }

      return $groupMembers;
    }

    return null;
  }

  private function getLogin(SimpleXMLElement $groupElement, SimpleXMLElement $loginElement, int $workspaceId): Login {
    $mode = (string) $loginElement['mode'];
    $name = (string) $loginElement['name'];

    $booklets = match ($mode) {
      'monitor-group' => ['' => $this->collectBookletsOfGroup($workspaceId, $name)],
      default => self::collectTestNamesPerCode($loginElement)
    };

    $monitors = match ($mode) {
      'monitor-group', 'monitor-study' => $this->collectProfiles($loginElement),
      default => []
    };

    return new Login(
      $name,
      (string) $loginElement['pw'],
      (string) $loginElement['mode'] ?? 'run-demo',
      (string) $groupElement['id'],
      (string) $groupElement['label'] ?? (string) $groupElement['id'],
      $booklets,
      $workspaceId,
      isset($groupElement['validTo']) ? TimeStamp::fromXMLFormat((string) $groupElement['validTo']) : 0,
      TimeStamp::fromXMLFormat((string) $groupElement['validFrom']),
      (int) ($groupElement['validFor'] ?? 0),
      $this->getCustomTexts(),
      $monitors
    );
  }

  // TODO write unit test
  // TODO make private
  /**
   * @return string[]
   */
  public function collectBookletsOfGroup(int $workspaceId, string $loginName): array {
    $members = $this->getLoginsInSameGroup($loginName, $workspaceId);
    /** @var $testNames string[] */
    $testNames = [];

    foreach ($members as $member) {
      /** @var $member Login */
      $codes2booklets = $member->testNames();

      foreach ($codes2booklets as $testNamesOfCode) {
        foreach ($testNamesOfCode as $testName) {
          $testNames[$testName] = $testName;
        }
      }
    }

    return array_values($testNames);
  }

  /** @return TestName[] */
  protected static function collectTestNamesPerCode(SimpleXMLElement $loginNode): array {
    /** @var $noCodeTestNames string[] */
    $noCodeTestNames = [];
    /** @var $codeTestNames string[] */
    $codeTestNames = [];

    $testNameFromElement = function (SimpleXMLElement $bookletElement): string {
      $bookletFileId = strtoupper(trim((string) $bookletElement));
      $statesString = (string) $bookletElement['state'];
      $testName = TestName::fromStrings($bookletFileId, $statesString);
      return $testName->name;
    };

    foreach ($loginNode->xpath('Booklet') as $bookletElement) {
      $testName = $testNameFromElement($bookletElement);
      if (!$testName) continue;

      $codesOfThisTestName = self::getCodesFromBookletElement($bookletElement);

      if (count($codesOfThisTestName) > 0) {
        foreach ($codesOfThisTestName as $c) {
          if (!isset($codeTestNames[$c])) {
            $codeTestNames[$c] = [];
          }

          if (!in_array($testName, $codeTestNames[$c])) {
            $codeTestNames[$c][] = $testName;
          }
        }

      } else {
        $noCodeTestNames[] = $testName;
      }
    }

    $noCodeTestNames = array_unique($noCodeTestNames);

    if (count($codeTestNames) === 0) {
      $codeTestNames = ['' => $noCodeTestNames];
    } else {
      // add all no-code-booklets to every code
      foreach ($codeTestNames as $code => $testNames) {
        $codeTestNames[$code] = array_unique(array_merge($testNames, $noCodeTestNames));
      }
    }

    return $codeTestNames;
  }

  /** @return string[] */
  protected static function getCodesFromBookletElement(SimpleXMLElement $bookletElement): array {
    if ($bookletElement->getName() !== 'Booklet') {
      return [];
    }

    $codesString = isset($bookletElement['codes'])
      ? trim((string) $bookletElement['codes'])
      : '';

    if (!$codesString) {
      return [];
    }

    return array_unique(explode(' ', $codesString));
  }

  public function getCustomTexts(): stdClass {
    $customTexts = [];
    foreach ($this->getXml()->xpath('/Testtakers/CustomTexts/CustomText') as $customTextElement) {
      $customTexts[(string) $customTextElement['key'] ?? ''] = (string) $customTextElement;
    }
    return (object) $customTexts;
  }

  /**
   * @return array[]
   */
  private function collectProfiles(SimpleXMLElement $loginElem): array {
    $profiles = array_map(
      function(SimpleXMLElement $profileReferenceElem): SimpleXMLElement | null {
        $id = ((string) $profileReferenceElem['id']);
        $profileElems = $this->getXml()->xpath('//Profiles/GroupMonitor/Profile[@id="' . $id . '"]');
        if (count($profileElems) !== 1) {
          $this->report('error', "Profile with `$id` referenced but not provided");
          return null;
        }
        return $profileElems[0];
      },
      $loginElem->xpath('Profile')
    );
    $profiles = array_filter(
      $profiles,
      fn (SimpleXMLElement | null $profileElem) => !!$profileElem
    );
    return array_map(
      fn (SimpleXMLElement $profileElem): array => [
        'id' => ((string) $profileElem['id']) ?? Random::string(8, false),
        'label' =>  ((string) $profileElem['label']) ?? "",
        'settings' => [
          'blockColumn' => ((string) $profileElem['blockColumn']) ?? "show",
          'unitColumn' => ((string) $profileElem['unitColumn']) ?? "show",
          'view' => ((string) $profileElem['view']) ?? "middle",
          'groupColumn' => ((string) $profileElem['groupColumn']) ?? "hide",
          'bookletColumn' => ((string) $profileElem['bookletColumn']) ?? "show"
        ],
        'filters' => array_map(
          fn (SimpleXMLElement $filterElem): array => [
            'target' => ((string) $filterElem['field']) ?? "personLabel",
            'value' => ((string) $filterElem['value']) ?? "",
            'label' => ((string) $filterElem['label']) ?? "",
            'type' => ((string) $filterElem['type']) ?? "equals",
            'not' => ((bool) $profileElem['not']) ?? false
          ],
          $profileElem->xpath('Filter')
        ),
        'filtersEnabled' => [
          'pending' => ((string) $profileElem['filterPending']) ?? "no",
          'locked' => ((string) $profileElem['filterLocked']) ?? "no"
        ]
      ],
      $profiles
    );
  }
}

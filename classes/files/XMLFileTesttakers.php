<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileTesttakers extends XMLFile {

    const type = 'Testtakers';

    protected array $testtakers = [];

    public function crossValidate(WorkspaceValidator $validator): void {

        $this->testtakers = $this->getAllTesttakers();

        $this->checkForDuplicateLogins();

        foreach ($this->testtakers as $testtaker) {

            /* @var PotentialLogin $testtaker */
            $this->checkIfBookletsArePresent($testtaker, $validator);
        }

        $this->checkIfIdsAreUsedInOtherFiles($validator);
    }


    public function getTesttakerCount() {

        return count($this->testtakers);
    }


    private function checkForDuplicateLogins(): void {

        $doubleLogins = $this->getDoubleLoginNames();
        if (count($doubleLogins) > 0) {
            foreach ($doubleLogins as $login) {
                $this->report('error', "Duplicate login: `$login`");
            }
        }
    }


    private function checkIfBookletsArePresent(PotentialLogin $testtaker, WorkspaceValidator $validator): void {

        foreach ($testtaker->getBooklets() as $code => $booklets) {

            foreach ($booklets as $bookletId) {

                $booklet = $validator->getBooklet($bookletId);

                if ($booklet != null) {

                    $booklet->addUsedBy($this);

                } else {

                    $this->report('error', "Booklet `$bookletId` not found for login `{$testtaker->getName()}`");
                }
            }
        }
    }


    private function checkIfIdsAreUsedInOtherFiles(WorkspaceValidator $validator): void {

        $loginList = $this->getAllLoginNames();
        $groupList = array_keys($this->getGroups());

        foreach (TesttakersFolder::getAll() as $otherTesttakersFolder) {

            /* @var TesttakersFolder $otherTesttakersFolder */

            foreach ($otherTesttakersFolder->getAllLoginNames() as $otherFilePath => $otherLoginList) {

                if ($this->getPath() == $otherFilePath) {
                    continue;
                }

                $this->reportDuplicates(
                    'login',
                    array_intersect($loginList, $otherLoginList),
                    basename($otherFilePath),
                    $validator->getWorkspaceId(),
                    $otherTesttakersFolder->getWorkspaceId()
                );
            }

            foreach ($otherTesttakersFolder->getAllGroups() as $otherFilePath => $otherGroupList) {

                if ($this->getPath() == $otherFilePath) {
                    continue;
                }

                $this->reportDuplicates(
                    'group',
                    array_intersect($groupList, array_keys($otherGroupList)),
                    basename($otherFilePath),
                    $validator->getWorkspaceId(),
                    $otherTesttakersFolder->getWorkspaceId()
                );
            }
        }
    }


    private function reportDuplicates(string $type, array $duplicates, string $otherFileName, int $thisWsId, int $otherWsId) {

        foreach ($duplicates as $duplicate) {

            $location = ($thisWsId !== $otherWsId) ? "on workspace $otherWsId " : '';
            $location .=  "in file `$otherFileName`";
            $this->report('error', "Duplicate $type: `$duplicate` - also $location");
        }
    }


    public function getAllTesttakers(): array {

        if (!$this->isValid()) {
            return [];
        }

        $testTakers = [];

        foreach($this->xml->xpath('Group') as $groupElement) {

            foreach ($groupElement->xpath('Login[@name]') as $loginElement) {

                $testTakers[] = $this->getPotentialLogin($groupElement, $loginElement, -1);
            }
        }

        return $testTakers;
    }


    public function getDoubleLoginNames(): array {

        if (!$this->isValid()) {
            return [];
        }

        $loginNames = [];

        foreach($this->xml->xpath('Group/Login[@name]') as $loginElement) {

            $loginNames[] = (string) $loginElement['name'];
        }

        return array_keys(array_filter(array_count_values($loginNames), function($count) {
            return $count > 1;
        }));
    }


    public function getAllLoginNames(): array {

        if (!$this->isValid()) {
            return [];
        }

        $loginNames = [];

        foreach($this->xml->xpath('Group/Login[@name]') as $loginElement) {

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

        foreach($this->xml->xpath('Group') as $groupElement) {

            $groups[(string) $groupElement['id']] = new Group(
                (string) $groupElement['id'],
                (string) $groupElement['label']
            );
        }

        return $groups;
    }


    public function getLogin(string $name, string $password, int $workspaceId): ?PotentialLogin {

        if (!$this->isValid()) {
            return null;
        }

        foreach($this->xml->xpath('Group') as $groupElement) {

            $selector = "@name='$name'" . ($password ?  " and @pw='$password'" : '');
            foreach($groupElement->xpath("Login[$selector]") as $loginElement) {

                return $this->getPotentialLogin($groupElement, $loginElement, $workspaceId);
            }
        }

        return null;
    }


    public function getMembersOfLogin(string $name, string $password, int $workspaceId): ?PotentialLoginArray {

        if (!$this->isValid()) {
            return null;
        }

        $selector = "@name='$name'" . ($password ?  " and  @pw='$password'" : '');
        foreach($this->xml->xpath("Group[Login[$selector]]") as $groupElement) {

            $groupMembers = new PotentialLoginArray();

            foreach ($groupElement->xpath('Login[@name][Booklet]') as $memberElement) {

                $groupMembers->add($this->getPotentialLogin($groupElement, $memberElement, $workspaceId));
            }

            return $groupMembers;
        }

        return null;
    }


    private function getPotentialLogin(SimpleXMLElement $groupElement, SimpleXMLElement $loginElement, int $workspaceId)
            : PotentialLogin {

        return new PotentialLogin(
            (string) $loginElement['name'],
            (string) $loginElement['mode'] ?? 'run-demo',
            (string) $groupElement['id'], // TODO add groupLabel
            self::collectBookletsPerCode($loginElement),
            $workspaceId,
            isset($groupElement['validTo']) ? TimeStamp::fromXMLFormat((string) $groupElement['validTo']) : 0,
            TimeStamp::fromXMLFormat((string) $groupElement['validFrom']),
            (int) ($groupElement['validFor'] ?? 0),
            $this->getCustomTexts()
        );
    }


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


    protected static function collectBookletsPerCode(SimpleXMLElement $loginNode) {

        $noCodeBooklets = [];
        $codeBooklets = [];

        foreach($loginNode->xpath('Booklet') as $bookletElement) {

            $bookletName = strtoupper(trim((string) $bookletElement));

            if (!$bookletName) {
                continue;
            }

            $codesOfThisBooklet = self::getCodesFromBookletElement($bookletElement);

            if (count($codesOfThisBooklet) > 0) {

                foreach($codesOfThisBooklet as $c) {

                    if (!isset($codeBooklets[$c])) {
                        $codeBooklets[$c] = [];
                    }

                    if (!in_array($bookletName, $codeBooklets[$c])) {
                        $codeBooklets[$c][] = $bookletName;
                    }
                }

            } else {

                $noCodeBooklets[] = $bookletName;
            }
        }

        $noCodeBooklets = array_unique($noCodeBooklets);

        if (count($codeBooklets) === 0) {

            $codeBooklets = ['' => $noCodeBooklets];

        } else {

            // add all no-code-booklets to every code
            foreach($codeBooklets as $code => $booklets) {

                $codeBooklets[$code] = array_unique(array_merge($codeBooklets[$code], $noCodeBooklets));
            }
        }

        return $codeBooklets;
    }


    public function getCustomTexts(): stdClass {

        $customTexts = [];
        foreach ($this->xml->xpath('/Testtakers/CustomTexts/CustomText') as $customTextElement) {

            $customTexts[(string) $customTextElement['key'] ?? ''] = (string) $customTextElement;
        }
        return (object) $customTexts;
    }
}

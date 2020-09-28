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

            /* @var PotentialLogin testtaker */

            $this->checkIfBookletsArePresent($testtaker, $validator);
            $this->checkIfLoginsAreUsedInOtherFiles($testtaker, $validator);
        }
    }


    private function checkForDuplicateLogins(): void {

        $doubleLogins = $this->getDoubleLoginNames();
        if (count($doubleLogins) > 0) {
            foreach ($doubleLogins as $login) {
                $this->report('error', "duplicate loginname `$login`");
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

                    $this->report('error', "booklet `$bookletId` not found for login `{$testtaker->getName()}`");
                }
            }
        }
    }


    private function checkIfLoginsAreUsedInOtherFiles(PotentialLogin $testtaker, WorkspaceValidator $validator): void {

        if (isset($validator->allLoginNames[$testtaker->getName()])) {

            $otherFilePath = $validator->allLoginNames[$testtaker->getName()];

            if ($otherFilePath !== $this->getPath()) {
                $this->report('error', "login `{$testtaker->getName()}` in `{$this->getPath()}` is already used in: `$otherFilePath`");
            }

        } else {

            $validator->allLoginNames[$testtaker->getName()] = $this->getPath();
        }
    }


    public function getTesttakersCount() {

        return count($this->testtakers);
    }


    public function getAllTesttakers(): array {

        if (!$this->isValid()) {
            return [];
        }

        $testTakers = [];

        foreach($this->xmlfile->xpath('Group') as $groupElement) {

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

        foreach($this->xmlfile->xpath('Group/Login[@name]') as $loginElement) {

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

        foreach($this->xmlfile->xpath('Group/Login[@name]') as $loginElement) {

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

        foreach($this->xmlfile->xpath('Group') as $groupElement) {

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

        foreach($this->xmlfile->xpath('Group') as $groupElement) {

            $selector = "@name='$name'" . ($password ?  " and  @pw='$password'" : '');
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
        foreach($this->xmlfile->xpath("Group[Login[$selector]]") as $groupElement) {

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
            (object) $this->getCustomTexts()
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
}

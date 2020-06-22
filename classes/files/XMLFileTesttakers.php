<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileTesttakers extends XMLFile {


    public function isValid(): bool {

        return $this->_isValid and ($this->xmlfile == true) and ($this->_rootTagName === 'Testtakers');
    }


    /**
     * @return array|null
     *
     * returns array of the structure ['groupname' => string, 'loginname' => string, 'code' => string, 'booklets' => string[]]
     * this should and can be replaced by a structured data-type like PotentialLogin. We keep this structure  for now
     * to maintain compatibility with other classes which have to be refactored later.
     * TODO refactor to return PotentialLogin[] -> affects WorkspaceValidator and BookletsFolder
     */
    public function getAllTesttakers(): array {

        if (!$this->isValid()) {
            return [];
        }

        $testTakers = [];

        foreach($this->xmlfile->xpath('Group') as $groupElement) {

            foreach ($groupElement->xpath('Login[@name]') as $loginElement) {

                $bookletsPerCode = $this->collectBookletsPerCode($loginElement);

                foreach ($bookletsPerCode as $code => $booklets) {

                    if (count($booklets)) {

                        $testTakers[] = [
                            'groupname' => (string) $groupElement['name'],
                            'loginname' => (string) $loginElement['name'], // TODO add groupLabel
                            'code' => $code,
                            'booklets' => $booklets
                        ];
                    }
                }
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

            $groups[(string) $groupElement['name']] = new Group(
                (string) $groupElement['name'],
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
            (string) $loginElement['mode'] ?? 'run-hot-return',
            (string) $groupElement['name'], // TODO groupLabel
            $this->collectBookletsPerCode($loginElement),
            $workspaceId,
            isset($groupElement['validTo']) ? TimeStamp::fromXMLFormat((string) $groupElement['validTo']) : 0,
            TimeStamp::fromXMLFormat((string) $groupElement['validFrom']),
            (int) ($groupElement['validFor'] ?? 0),
            (object) $this->getCustomTexts()
        );
    }


    public function getCodesFromBookletElement(SimpleXMLElement $bookletElement): array {

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


    public function collectBookletsPerCode(SimpleXMLElement $loginNode) {

        $noCodeBooklets = [];
        $codeBooklets = [];

        foreach($loginNode->xpath('Booklet') as $bookletElement) {

            $bookletName = strtoupper(trim((string) $bookletElement));

            if (!$bookletName) {
                continue;
            }

            $codesOfThisBooklet = $this->getCodesFromBookletElement($bookletElement);

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

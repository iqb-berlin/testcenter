<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileTesttakers extends XMLFile {

    /**
     * @return array|null
     *
     * returns array of the structure ['groupname' => string, 'loginname' => string, 'code' => string, 'booklets' => string[]]
     * this shoudla nd can be replaces by a structured data-type like PotentialLogin. We keep this structure to maintain
     * compatibility with other classes which have to be rafctored later.
     * TODO refactor to return PotentialLogin[] -> affects WorkspaceValidator and BookletsFolder
     */
    public function getAllTesttakers(): ?array {

        if (!$this->_isValid or ($this->xmlfile == false) or ($this->_rootTagName != 'Testtakers')) { // TODO prove redundancy of this check
            return null;
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


    public function getDoubleLoginNames() {

        if (!$this->_isValid or ($this->xmlfile == false) or ($this->_rootTagName != 'Testtakers')) { // TODO prove redundancy of this check
            return null;
        }

        $loginNames = [];

        foreach($this->xmlfile->xpath('Group') as $groupElement) {

            foreach ($groupElement->xpath('Login[@name]') as $loginElement) {

                $loginNames[] = (string) $loginElement['name'];
            }
        }

        return array_keys(array_filter(array_count_values($loginNames), function($count) {
            return $count > 1;
        }));
    }


    public function getAllLoginNames() {

        if (!$this->_isValid or ($this->xmlfile == false) or ($this->_rootTagName != 'Testtakers')) { // TODO prove redundancy of this check
            return null;
        }

        $loginNames = [];

        foreach($this->xmlfile->xpath('Group') as $groupElement) {

            foreach ($groupElement->xpath('Login[@name]') as $loginElement) {

                if (!in_array((string) $loginElement['name'], $loginNames)) {
                    $loginNames[] = (string) $loginElement['name'];
                }
            }
        }

        return $loginNames;
    }


    public function getGroups(): array {

        if (!$this->_isValid or ($this->xmlfile == false) or ($this->_rootTagName != 'Testtakers')) { // TODO prove redundancy of this check
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


    public function getLogin(string $givenLoginName, string $givenPassword, int $workspaceId): ?PotentialLogin { // TODO muss passwort sein?

        if (!$this->_isValid or ($this->xmlfile == false) or ($this->_rootTagName != 'Testtakers')) { // TODO prove redundancy of this check
            return null;
        }

        foreach($this->xmlfile->xpath('Group') as $groupElement) {

            foreach($groupElement->xpath('Login[@name]') as $loginElement) {

                if ($this->isMatchingLogin($loginElement, $givenLoginName, $givenPassword)) {

                    return $this->getPotentialLogin($groupElement, $loginElement, $workspaceId);
                }
            }
        }

        return null;
    }


    public function getMembersOfLogin(string $givenLoginName, string $givenPassword, int $workspaceId): ?PotentialLoginArray { // TODO muss passwort sein?

        if (!$this->_isValid or ($this->xmlfile == false) or ($this->_rootTagName != 'Testtakers')) { // TODO prove redundancy of this check
            return null;
        }

        foreach($this->xmlfile->xpath('Group') as $groupElement) {

            foreach ($groupElement->xpath('Login[@name]') as $loginElement) {

                if ($this->isMatchingLogin($loginElement, $givenLoginName, $givenPassword)) {

                    $groupMembers = new PotentialLoginArray();

                    foreach ($groupElement->xpath('Login[@name][Booklet]') as $memberElement) {

                        $groupMembers->add($this->getPotentialLogin($groupElement, $memberElement, $workspaceId));
                    }

                    return $groupMembers;
                }
            }
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


    public function isMatchingLogin(SimpleXMLElement $loginElement, string $matchName, string $matchPw = '', string $matchCode = null): bool {

        if ($loginElement->getName() !== 'Login') {
            return false;
        }

        $name2 = (string) $loginElement['name'];
        $isMatching = ($name2 == $matchName);

        if ($matchPw) {

            $password2 = (string) $loginElement['pw'];
            $isMatching = ($isMatching and ($password2 == $matchPw));
        }

        if ($matchCode !== null) {

            $availableCodesInThisLogin = $this->getCodesFromLoginElement($loginElement);
            $isMatching = ($isMatching and in_array($matchCode, $availableCodesInThisLogin));
        }

        return $isMatching;
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


    // TODO unit-test
    public function getCodesFromLoginElement(SimpleXMLElement $loginElement): array {

        if ($loginElement->getName() !== 'Login') {
            return [];
        }

        $allCodes = [];

        foreach ($loginElement->children() as $bookletElement) {
            $allCodes = array_merge($allCodes, $this->getCodesFromBookletElement($bookletElement));
        }

        return array_unique($allCodes);
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

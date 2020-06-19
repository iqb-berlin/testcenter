<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileTesttakers extends XMLFile {

    // TODO refactor, unit-test
    // // ['groupname' => string, 'loginname' => string, 'code' => string, 'booklets' => string[]]
    public function getAllTesttakers() {
        $myreturn = [];

        if ($this->_isValid and ($this->xmlfile != false) and ($this->_rootTagName == 'Testtakers')) {
            $allLoginNames = []; // double logins are ignored
            foreach($this->xmlfile->children() as $groupNode) {

                if ($groupNode->getName() == 'Group') {

                    $groupnameAttr = $groupNode['name'];

                    if (isset($groupnameAttr)) {

                        $groupname = (string) $groupnameAttr;

                        foreach($groupNode->children() as $loginNode) {

                            if ($loginNode->getName() == 'Login') {

                                $loginNameAttr = $loginNode['name'];

                                if (isset($loginNameAttr)) {

                                    $loginName = (string) $loginNameAttr;

                                    if (!in_array($loginName, $allLoginNames)) {
                                        array_push($allLoginNames, $loginName);

                                        if (strlen($loginName) > 2) {

                                            // only valid logins are taken //////////////////////////////////
                                            
                                            // collect all codes
                                            $allCodes = [];
                                            foreach($loginNode->children() as $bookletElement) {
                                                if ($bookletElement->getName() == 'Booklet') {
                                                    foreach($this->getCodesFromBookletElement($bookletElement) as $c) {
                                                        if (!in_array($c, $allCodes)) {
                                                            array_push($allCodes, $c);
                                                        }
                                                    }
                                                }
                                            }

                                            // collect booklets per code and booklets with no code
                                            $noCodeBooklets = [];
                                            $codeBooklets = []; // key: code, value: bookletName[]
                                            foreach($loginNode->children() as $bookletElement) {
                                                if ($bookletElement->getName() == 'Booklet') {
                                                    $bookletName = strtoupper(trim((string) $bookletElement));
                                                    if (strlen($bookletName) > 0) {
                                                        $myCodes = $this->getCodesFromBookletElement($bookletElement);
                                                        if (count($myCodes) > 0) {
                                                            foreach($myCodes as $c) {
                                                                if (!isset($codeBooklets[$c])) {
                                                                    $codeBooklets[$c] = [];
                                                                }
                                                                if (!in_array($bookletName, $codeBooklets[$c])) {
                                                                    array_push($codeBooklets[$c], $bookletName);
                                                                }
                                                            }
                                                        } else {
                                                            if (!in_array($bookletName, $noCodeBooklets)) {
                                                                array_push($noCodeBooklets, $bookletName);
                                                            }
                                                        }
                                                    }
                                                }
                                            }

                                            if (count($codeBooklets) > 0) {
                                                if (count($noCodeBooklets) > 0) {
                                                    // add all no-code-booklets to every code
                                                    foreach($codeBooklets as $code => $booklets) {
                                                        foreach($noCodeBooklets as $booklet) {
                                                            if (!in_array($booklet, $codeBooklets[$code])) {
                                                                array_push($codeBooklets[$code], $booklet);
                                                            }
                                                        }
                                                    }
                                                }
                                                foreach($codeBooklets as $code => $booklets) {
                                                    array_push($myreturn, [
                                                        'groupname' => $groupname,
                                                        'loginname' => $loginName,
                                                        'code' => $code,
                                                        'booklets' => $booklets
                                                    ]);
                                                }
                                            } else {
                                                if (count($noCodeBooklets) > 0) {
                                                        array_push($myreturn, [
                                                        'groupname' => $groupname,
                                                        'loginname' => $loginName,
                                                        'code' => '',
                                                        'booklets' => $noCodeBooklets
                                                    ]);
                                                }
                                            }
                                            // //////////////////////////////////////////////////////////////
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return $myreturn;
    }


    // TODO refactor, unit-test
    public function getDoubleLoginNames() {

        $myreturn = [];
        if ($this->_isValid and ($this->xmlfile != false) and ($this->_rootTagName == 'Testtakers')) {
            $allLoginNames = [];
            foreach($this->xmlfile->children() as $groupNode) {
                if ($groupNode->getName() == 'Group') {
                    $groupnameAttr = $groupNode['name'];
                    if (isset($groupnameAttr)) {

                        foreach($groupNode->children() as $loginNode) {
                            if ($loginNode->getName() == 'Login') {
                                $loginNameAttr = $loginNode['name'];
                                if (isset($loginNameAttr)) {
                                    $loginName = (string) $loginNameAttr;
                                    if (!in_array($loginName, $allLoginNames)) {
                                        array_push($allLoginNames, $loginName);
                                    } else {
                                        if (!in_array($loginName, $myreturn)) {
                                            array_push($myreturn, $loginName);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return $myreturn;
    }


    // TODO refactor, unit-test
    public function getAllLoginNames() {
        $myreturn = [];
        if ($this->_isValid and ($this->xmlfile != false) and ($this->_rootTagName == 'Testtakers')) {
            foreach($this->xmlfile->children() as $groupNode) {
                if ($groupNode->getName() == 'Group') {
                    $groupnameAttr = $groupNode['name'];
                    if (isset($groupnameAttr)) {

                        foreach($groupNode->children() as $loginNode) {
                            if ($loginNode->getName() == 'Login') {
                                $loginNameAttr = $loginNode['name'];
                                if (isset($loginNameAttr)) {
                                    $loginName = (string) $loginNameAttr;
                                    if (!in_array($loginName, $myreturn)) {
                                        array_push($myreturn, $loginName);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return $myreturn;
    }


    public function getLoginData(string $givenLoginName, string $givenPassword, int $workspaceId): ?PotentialLogin {

        $groupAndContext = $this->findGroupElementByLogin($givenLoginName, $givenPassword);

        if (!$groupAndContext) {

            return null;
        }

        /* @var $groupNode SimpleXmlElement */
        $groupNode = $groupAndContext['group'];
        /* @var $loginNode SimpleXmlElement */
        $loginNode = $groupAndContext['login'];

        return new PotentialLogin(
            (string) $loginNode['name'],
            (string) $loginNode['mode'] ?? 'run-hot-return',
            (string) $groupNode['name'], // TODO groupLabel
            $this->collectBookletsPerCode($loginNode),
            $workspaceId,
            isset($groupNode['validTo']) ? TimeStamp::fromXMLFormat((string) $groupNode['validTo']) : 0,
            TimeStamp::fromXMLFormat((string) $groupNode['validFrom']),
            (int) ($groupNode['validFor'] ?? 0),
            (object) $this->getCustomTexts()
        );
    }


    // TODO unit-test
    public function findGroupElementByLogin(string $matchName, string $matchPw = '', string $matchCode = null): ?array {

        if (!$this->_isValid or ($this->xmlfile == false) or ($this->_rootTagName != 'Testtakers')) {
            return null;
        }

        foreach($this->xmlfile->children() as $groupElement) {

            if (!$groupElement->getName() == 'Group') {
                continue;
            }

            foreach($groupElement->children() as $loginElement) {

                if ($loginElement->getName() !== 'Login') {
                    continue;
                }

                if (!$this->isMatchingLogin($loginElement, $matchName, $matchPw, $matchCode)) {
                    continue;
                }

                return [
                    "group" => $groupElement,
                    "login" => $loginElement,
                ];
            }
        }

        return null;
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

        foreach($loginNode->children() as $bookletElement) {

            if ($bookletElement->getName() !== 'Booklet') {
                continue;
            }

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


    public function getGroups(): array {

        if (!$this->_isValid or ($this->xmlfile == false) or ($this->_rootTagName != 'Testtakers')) {
            return [];
        }

        $groups = [];

        foreach($this->xmlfile->children() as $groupElement) {

            if ($groupElement->getName() != 'Group') {
                continue;
            }

            $groups[(string) $groupElement['name']] = new Group(
                (string) $groupElement['name'],
                (string) $groupElement['label']
            );
        }

        return $groups;
    }


    // TODO implement, unit-Test
    public function getGroupOfLogin(string $givenLoginName, string $givenPassword = null, string $givenCode = null): ?Group {

        $groupAndContext = $this->findGroupElementByLogin($givenLoginName, $givenPassword, $givenCode);

        if (!$groupAndContext) {

            return null;
        }

        /* @var $groupNode SimpleXmlElement */
        $groupNode = $groupAndContext['group'];








        return null;
    }

}

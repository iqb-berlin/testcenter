<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);


class XMLFileTesttakers extends XMLFile {

    // TODO unit-test
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


    // TODO unit-test
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


    // TODO unit-test
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

        if (!$this->_isValid or ($this->xmlfile == false) or ($this->_rootTagName != 'Testtakers')) {
            return null;
        }

        foreach($this->xmlfile->children() as $groupNode) {

            if (!$groupNode->getName() == 'Group') {
                continue;
            }

            $groupNameAttr = $groupNode['name'];

            if (!isset($groupNameAttr)) {
                continue;
            }

            $groupName = (string) $groupNameAttr;

            $validFrom = TimeStamp::fromXMLFormat((string) $groupNode['validFrom']);
            $validTo = isset($groupNode['validTo']) ? TimeStamp::fromXMLFormat((string) $groupNode['validTo']) : 0;
            $validForMinutes = (int) ($groupNode['validFor'] ?? 0);

            foreach($groupNode->children() as $loginNode) {

                if ($loginNode->getName() !== 'Login') {
                    continue;
                }

                $mode = (string) $loginNode['mode'] ?? 'run-hot-return';

                if (!$this->isMatchingLogin($loginNode, $givenLoginName, $givenPassword)) {
                    continue;
                }

                $codeBooklets = $this->collectBookletsPerCode($loginNode);

                return new PotentialLogin(
                    (string) $loginNode['name'],
                    $mode,
                    $groupName,
                    $codeBooklets,
                    $workspaceId,
                    $validTo,
                    $validFrom,
                    $validForMinutes,
                    (object) $this->getCustomTexts()
                );


            }

        }

        return null;
    }


    // TODO CODE IS BOOKLET_CHILD NOT LOGIN !11
    public function isMatchingLogin(SimpleXMLElement $loginElement, string $name, string $password = '', string $code = null): bool {

        $name2 = (string) $loginElement['name'];
        $isMatching = ($name2 == $name);

        if ($password) {

            $password2 = (string) $loginElement['pw'];
            $isMatching = ($isMatching and ($password2 == $password));
        }

        if ($code !== null) {

            $availableCodesInThisLogin = $this->getCodesFromLoginElement($loginElement);
            $isMatching = ($isMatching and in_array($code, $availableCodesInThisLogin));
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


    function getGroups(): array {

        if (!$this->_isValid or ($this->xmlfile == false) or ($this->_rootTagName != 'Testtakers')) {
            return [];
        }

        $groups = [];

        foreach($this->xmlfile->children() as $groupNode) {

            if (!$groupNode->getName() == 'Group') {
                continue;
            }

            $groups[(string) $groupNode['name']] = new Group(
                (string) $groupNode['name'],
                (string) $groupNode['label']
            );
        }

        return $groups;
    }


    // STAND
    function getGroupOfLogin(string $name, string $password = null, string $code = null): array {

        if (!$this->_isValid or ($this->xmlfile == false) or ($this->_rootTagName != 'Testtakers')) {
            return [];
        }

        foreach($this->xmlfile->children() as $groupNode) {

            if (!$groupNode->getName() == 'Group') {
                continue;
            }


        }

        return []
    }

}

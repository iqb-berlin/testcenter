<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

require_once('XMLFile.php');

class XMLFileTesttakers extends XMLFile
{
    // ####################################################
    private function getCodesFromBookletElement($bookletElement) {
        $myreturn = [];
        if ($bookletElement->getName() == 'Booklet') {
            $codesAttr = $bookletElement['codes'];
            if (isset($codesAttr)) {
                $codes = (string) $codesAttr;
                if (strlen(trim($codes)) > 0) {
                    foreach(explode(' ', $codes) as $c) {
                        if (strlen($c) > 0) {
                            if (!in_array($c, $myreturn)) {
                                array_push($myreturn, $c);
                            }
                        }
                    }
                }
            }
        }
        return $myreturn;
    }

    // ####################################################
    // ['groupname' => string, 'loginname' => string, 'code' => string, 'booklets' => string[]]
    public function getAllTesttakers($onlyMode = '')
    {
        $myreturn = [];

        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'Testtakers')) {
            $allLoginNames = []; // double logins are ignored
            foreach($this->xmlfile->children() as $groupNode) {
                if ($groupNode->getName() == 'Group') {
                    $groupnameAttr = $groupNode['name'];
                    $modeAttr = $groupNode['mode'];
                    if (isset($groupnameAttr) and isset($modeAttr) and (($onlyMode == '') or ($onlyMode == (string) $modeAttr))) {
                        $groupname = (string) $groupnameAttr;

                        foreach($groupNode->children() as $loginNode) {
                            if ($loginNode->getName() == 'Login') {
                                $loginNameAttr = $loginNode['name'];
                                $loginPwAttr = $loginNode['pw'];
                                if (isset($loginNameAttr) and isset($loginPwAttr)) {
                                    $loginName = (string) $loginNameAttr;
                                    if (!in_array($loginName, $allLoginNames)) {
                                        array_push($allLoginNames, $loginName);

                                        $loginPw = (string) $loginPwAttr;
                                        if ((strlen($loginName) > 2) and (strlen($loginPw) > 2)) {

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

    // ####################################################
    public function getDoubleLoginNames()
    {
        $myreturn = [];
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'Testtakers')) {
            $allLoginNames = [];
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

    // ####################################################
    public function getAllLoginNames()
    {
        $myreturn = [];
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'Testtakers')) {
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

    // ####################################################
    public function getLoginData($givenLoginName, $givenPassword) {
        $myreturn = ['groupname' => '', 'mode' => '', 'loginname' => '', 'booklets' => []];

        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'Testtakers')) {
            foreach($this->xmlfile->children() as $groupNode) {
                if ($groupNode->getName() == 'Group') {
                    $groupnameAttr = $groupNode['name'];
                    $modeAttr = $groupNode['mode'];
                    if (isset($groupnameAttr) and isset($modeAttr)) {
                        $groupname = (string) $groupnameAttr;
                        $mode = (string) $modeAttr;

                        foreach($groupNode->children() as $loginNode) {
                            if ($loginNode->getName() == 'Login') {
                                $loginNameAttr = $loginNode['name'];
                                $loginPwAttr = $loginNode['pw'];
                                if (isset($loginNameAttr) and isset($loginPwAttr)) {
                                    $loginName = (string) $loginNameAttr;
                                    if ((strlen($loginName) > 2) and ($loginName == $givenLoginName)) {
                                        $loginPw = (string) $loginPwAttr;
                
                                        if ((strlen($loginPw) > 2) and ($loginPw == $givenPassword)) {
   
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

                                                $myreturn = [
                                                    'groupname' => $groupname,
                                                    'loginname' => $loginName,
                                                    'mode' => $mode,
                                                    'booklets' => $codeBooklets
                                                ];
                                            } else {
                                                if (count($noCodeBooklets) > 0) {
                                                    $myreturn = [
                                                        'groupname' => $groupname,
                                                        'loginname' => $loginName,
                                                        'mode' => $mode,
                                                        'booklets' => ['' => $noCodeBooklets]
                                                    ];
                                                }
                                            }

                                            // //////////////////////////////////////////////////////////////
                                        }
                                        break; // abort also if the given password is incorrect
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
}

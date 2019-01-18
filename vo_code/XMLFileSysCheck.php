<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

require_once('XMLFile.php');

class XMLFileSysCheck extends XMLFile
{
    // # # # # # # # # # # # # # # # # # # # # # # # # # # # #
    public function getUnitId()
    {
        $myreturn = '';
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'SysCheck')) {
            $configNode = $this->xmlfile->Config[0];
            if (isset($configNode)) {
                $unitAttr = $configNode['unit'];
                if (isset($unitAttr)) {
                    $myreturn = strtoupper((string) $unitAttr);
                }
            }
        }
        return $myreturn;
    }

    // # # # # # # # # # # # # # # # # # # # # # # # # # # # #
    private function getSaveKey()
    {
        $myreturn = '';
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'SysCheck')) {
            $configNode = $this->xmlfile->Config[0];
            if (isset($configNode)) {
                $savekeyAttr = $configNode['savekey'];
                if (isset($savekeyAttr)) {
                    $myreturn = (string) $savekeyAttr;
                }
            }
        }
        return $myreturn;
    }

    // ####################################################
    public function hasSaveKey()
    {
        $myKey = $this->getSaveKey();
        return strlen($myKey) > 0;
    }

    // ####################################################
    public function hasUnit()
    {
        $myUnitId = $this->getUnitId();
        return strlen($myUnitId) > 0;
    }

    // ####################################################
    public function getQuestionsOnlyMode()
    {
        $myreturn = false;
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'SysCheck')) {
            $configNode = $this->xmlfile->Config[0];
            if (isset($configNode)) {
                $qomAttr = $configNode['questionsonlymode'];
                if (isset($qomAttr)) {
                    $qom = (string) $qomAttr;
                    $myreturn = ($qom == 'true');
                }
            }
        }
        return $myreturn;
    }

    // ####################################################
    public function getSkipNetwork()
    {
        $myreturn = false;
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'SysCheck')) {
            $configNode = $this->xmlfile->Config[0];
            if (isset($configNode)) {
                $qomAttr = $configNode['skipnetwork'];
                if (isset($qomAttr)) {
                    $qom = (string) $qomAttr;
                    $myreturn = ($qom == 'true');
                }
            }
        }
        return $myreturn;
    }

    // ####################################################
    public function getQuestions()
    {
        $myreturn = [];
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'SysCheck')) {
            $configNode = $this->xmlfile->Config[0];
            if (isset($configNode)) {
                foreach($configNode->children() as $q) { 
                    if ($q->getName() === 'Q') {
                        array_push($myreturn, [
                            'id' => (string) $q['id'],
                            'type' => (string) $q['type'],
                            'prompt' => (string) $q['prompt'],
                            'value' => (string) $q
                        ]);
                    }
                }
            }
        }
        return $myreturn;
    }

    // ####################################################
    public function getRatings()
    {
        $myreturn = [];
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'SysCheck')) {
            $ratingsNode = $this->xmlfile->Ratings[0];
            if (isset($ratingsNode)) {
                foreach($ratingsNode->children() as $r) { 
                    if ($r->getName() === 'R') {
                        array_push($myreturn, [
                            'type' => (string) $r['type'],
                            'min' => (string) $r['min'],
                            'good' => (string) $r['good'],
                            'value' => (string) $r
                        ]);
                    }
                }
            }
        }
        return $myreturn;
    }

    // ####################################################
    public function getUnitData() {
        $myreturn = [
            'key' => '',
            'label' => '',
            'def' => '',
            'player' => ''
        ];
        $myUnitId = $this->getUnitId();
        if (strlen($myUnitId) > 0) {
            $workspaceDirName = dirname(dirname($this->filename));
            if (isset($workspaceDirName) && is_dir($workspaceDirName)) {
                $myreturn['workspaceDirName'] = $workspaceDirName;
                
                $unitFolder = $workspaceDirName . '/Unit';
                $resourcesFolder = $workspaceDirName . '/Resource';
                $mydir = opendir($unitFolder);
                if ($mydir !== false) {
                    $unitNameUpper = strtoupper($myUnitId);

                    require_once('XMLFile.php'); // // // // ========================
                    while (($entry = readdir($mydir)) !== false) {
                        $fullfilename = $unitFolder . '/' . $entry;
                        if (is_file($fullfilename) && (strtoupper(substr($entry, -4)) == '.XML')) {

                            $xFile = new XMLFile($fullfilename);
                            if ($xFile->isValid()) {
                                $uKey = $xFile->getId();
                                if ($uKey == $unitNameUpper) {
                                    $definitionNode = $xFile->xmlfile->Definition[0];
                                    if (isset($definitionNode)) {
                                        $typeAttr = $definitionNode['type'];
                                        if (isset($typeAttr)) {
                                            $myreturn['player_id'] = (string) $typeAttr;
                                            $myreturn['def'] = (string) $definitionNode;
                                        }
                                    } else {
                                        $definitionNode = $xFile->xmlfile->DefinitionRef[0];
                                        if (isset($definitionNode)) {
                                            $typeAttr = $definitionNode['type'];
                                            if (isset($typeAttr)) {
                                                $myreturn['player_id'] = (string) $typeAttr;
                                                $unitfilename = strtoupper((string) $definitionNode);
                                                $myRdir = opendir($resourcesFolder);
                                                if ($myRdir !== false) {
                                                    while (($anyfile = readdir($myRdir)) !== false) {
                                                        if (strtoupper($anyfile) == $unitfilename) {
                                                            $fullanyfilename = $resourcesFolder . '/' . $anyfile;
                                                            $myreturn['def'] = file_get_contents($fullanyfilename);
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }            
                                    break;
                                }
                            }
                        }
                    }
                    if (isset($myreturn['player_id'])) {
                        $myFile = $resourcesFolder . '/' . $myreturn['player_id'] . '.html';
                        if (file_exists($myFile)) {
                            $myreturn['player'] = file_get_contents($myFile);
                        }
                    }
                }
            }
        }
        
        return $myreturn;
    }
}

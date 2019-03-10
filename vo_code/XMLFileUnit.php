<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Mechtel
// 2018, 2019
// license: MIT

require_once('XMLFile.php');

class XMLFileUnit extends XMLFile
{
    // ####################################################
    public function getPlayer()
    {
        $myreturn = '';
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'Unit')) {
            $definitionNode = $this->xmlfile->Definition[0];
            if (isset($definitionNode)) {
                $playerAttr = $definitionNode['player'];
                if (isset($playerAttr)) {
                    $myreturn = (string) $playerAttr;
                }
            } else {
                $definitionNode = $this->xmlfile->DefinitionRef[0];
                if (isset($definitionNode)) {
                    $playerAttr = $definitionNode['player'];
                    if (isset($playerAttr)) {
                        $myreturn = (string) $playerAttr;
                    }
                }
            }
        }
        return $myreturn;
    }

    // ####################################################
    public function getResourceFilenames()
    {
        $myreturn = [];
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'Unit')) {
            $resourcesNode = $this->xmlfile->Resources[0];
            if (isset($resourcesNode)) {
                foreach($resourcesNode->children() as $r) { 
                    $rFilename = (string) $r;
                    if (isset($rFilename)) {
                        array_push($myreturn, $rFilename);
                    }
                }
            }
            $definitionNode = $this->xmlfile->DefinitionRef[0];
            if (isset($definitionNode)) {
                $rFilename = (string) $definitionNode;
                if (isset($rFilename)) {
                    array_push($myreturn, $rFilename);
                }
            }
        }
        return $myreturn;
    }
}

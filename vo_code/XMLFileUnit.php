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
    public function getDefinitionRef()
    {
        $myreturn = '';
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'Unit')) {
            $definitionNode = $this->xmlfile->DefinitionRef[0];
            if (isset($definitionNode)) {
                $rFilename = (string) $definitionNode;
                if (isset($rFilename)) {
                    $myreturn = $rFilename;
                }
            }
        }
        return $myreturn;
    }
}

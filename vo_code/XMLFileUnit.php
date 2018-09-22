<?php
// www.IQB.hu-berlin.de
// Bărbulescu, Stroescu, Mechtel
// 2018
// license: MIT

require_once('XMLFile.php');

class XMLFileUnit extends XMLFile
{
    // ####################################################
    public function getUnitDefinitonType()
    {
        $myreturn = '';
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'Unit')) {
            $definitionNode = $this->xmlfile->Definition[0];
            if (isset($definitionNode)) {
                $typeAttr = $definitionNode['type'];
                if (isset($typeAttr)) {
                    $myreturn = (string) $typeAttr;
                }
            }
        }
        return $myreturn;
    }

    // ####################################################
    public function getUnitDefiniton()
    {
        $myreturn = '';
        if ($this->isValid and ($this->xmlfile != false) and ($this->rootTagName == 'Unit')) {
            $definitionNode = $this->xmlfile->Definition[0];
            if (isset($definitionNode)) {
                $myreturn = (string) $definitionNode;
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
        }
        return $myreturn;
    }
}
